const fetch = require('node-fetch');
const SortedMap = require("collections/sorted-map");
const fs = require('fs');
const Helper = require('../../../helper');

let cfgFile = fs.readFileSync('resources/config.json');
let config = JSON.parse(cfgFile);
let url = config.jira.address;
let api = config.jira.api;
let login = config.jira.user.login;
let token = config.jira.token;

module.exports.healthCheck = function () {
    return timeout(500, fetch(url + api + '/myself', {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${Buffer.from(
                login + ':' + token
            ).toString('base64')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })).then(response => {
        console.log(
            `Response: ${response.status} ${response.statusText}`
        );
        return response.status;
    }).catch(function (err) {
        console.log(
            `Error: ${err}`
        );
        return "ERROR";
    });
}

module.exports.getUserByUsername = function (username) {
    return fetch(url + api + '/user/search?query=' + username,
        {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${Buffer.from(
                    login + ':' + token
                ).toString('base64')}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then(response => {
            return response.json();
        }
    )
}

module.exports.getUserLoggedHoursFromDate = function (user, dateStart, dateEnd) {
    return fetch(url + api + '/search', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${Buffer.from(
                login + ':' + token
            ).toString('base64')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: getLoggedHoursForUserJiraQuery(user, dateStart.getTime(), dateEnd.getTime())
    }).then(response => {
        console.log(
            `Response: ${response.status} ${response.statusText}`
        );
        return response.json();
    });
}

function getLoggedHoursForUserJiraQuery(user, ts, te) {
    return `{
          "expand": [
            "names",
            "schema",
            "operations"
          ],
          "jql": "worklogAuthor = ${user} AND worklogDate >= ${ts} AND worklogDate <= ${te}",
          "maxResults": 55,
          "fields": [
            "worklog"
          ],
          "startAt": 0
        }`;
}

module.exports.getUserIssuesDuringPeriod = function (user, dateStart, dateEnd) {
    return fetch(url + api + '/search', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${Buffer.from(
                login + ':' + token
            ).toString('base64')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: getIssuesInfoForUserJiraQuery(user, dateStart.getTime(), dateEnd.getTime())
    }).then(response => {
        return response.json();
    });
}

function getIssuesInfoForUserJiraQuery(user, ts, te) {
    return `{
          "expand": [
            "names",
            "schema",
            "operations"
          ],
          "jql": "assignee changed after ${ts} to currentUser() AND assignee changed before ${te} to ${user}",
          "maxResults": 100,
          "fields": [
            "summary",
            "issuetype",
            "worklog"
          ],
          "startAt": 0
        }`;
}

module.exports.getWorkLog = function (resp, user) {
    var dateToLoggedHours = new SortedMap();
    resp.issues.forEach(issue => {
        issue.fields.worklog.worklogs.forEach(workLogItem => {

            if (workLogItem.updateAuthor.accountId === user) {

                var dateKey = Helper.formatDate(workLogItem.started); //new Date(new Date(workLogItem.started).toDateString());
                if (dateToLoggedHours.get(dateKey) == null) {
                    dateToLoggedHours.set(dateKey, new LoggedTime(workLogItem.timeSpentSeconds, issue.key));
                } else {
                    var log = dateToLoggedHours.get(dateKey);
                    log.log(workLogItem.timeSpentSeconds, issue.key)
                }
            }
        });
    });
    return dateToLoggedHours;
}

module.exports.extractInfo = function (resp, user, year) {
    var infoIssuesMonthly = new SortedMap();

    resp.forEach((issuesByMonth, index) => {
        issuesByMonth.issues.forEach(issue => {
            let timeLogged = getLoggedTimeByPeriod(issue.fields.worklog.worklogs, year, index, user)
            if (infoIssuesMonthly.get(index) == null) {
                infoIssuesMonthly.set(index, [
                    {
                        key: issue.key,
                        description: `${issue.fields.issuetype.name} - ${issue.fields.summary}`,
                        timeLogged: timeLogged
                    }
                ])
            } else {
                const issues = infoIssuesMonthly.get(index);
                issues.push({
                    key: issue.key,
                    description: `${issue.fields.issuetype.name} - ${issue.fields.summary}`,
                    timeLogged: timeLogged
                });
            }
        });
    });
    return infoIssuesMonthly;
}

function getLoggedTimeByPeriod(worklogs, year, monthIndex, user) {
    let timeSpent = 0;
    worklogs.forEach(workLogItem => {
        if (workLogItem.updateAuthor.accountId === user) {
            const dateStarted = Helper.getYearMonthIndex(workLogItem.started);
            if (Number(dateStarted.year) === Number(year) && Number(dateStarted.month) === Number(monthIndex)) {
                timeSpent += workLogItem.timeSpentSeconds
            }
        }
    });

    return timeSpent !== 0 ? `${Helper.convertToHours(timeSpent)}h` : 'unlogged';
}

function timeout(ms, promise) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            reject(new Error("timeout"))
        }, ms)
        promise.then(resolve, reject)
    })
}

class LoggedTime {
    constructor(time, issueId) {
        this.time = time;
        this.issueId = issueId;
    }

    log(time, issueId) {
        this.time += time;
        this.issueId += "," + issueId;
    }

    get getIssueId() {
        return this.issueId;
    }
}
