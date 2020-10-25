const fetch = require('node-fetch');
const SortedMap = require("collections/sorted-map");
const fs = require('fs');

let cfgFile = fs.readFileSync('resources/config.json');
let config = JSON.parse(cfgFile);
let url = config.jira.address;
let api = config.jira.api;
let login = config.jira.user.login;
let pass = config.jira.user.password;

module.exports.healthCheck = function () {
    return timeout(500, fetch(url + api + '/myself', {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${Buffer.from(
                login + ':' + pass
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

module.exports.getUserLoggedHoursFromDate = function (user, dateStart, dateEnd) {
    return fetch(url + api + '/search', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${Buffer.from(
                login + ':' + pass
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

module.exports.getWorkLog = function (resp, user) {
    var dateToLoggedHours = new SortedMap();
    resp.issues.forEach(issue => {
        issue.fields.worklog.worklogs.forEach(workLogItem => {
            // console.info(workLogItem.updateAuthor.name + " " + new Date(workLogItem.started).getDay() + " " + workLogItem.timeSpentSeconds);
            // console.info(issue.key);

            if (workLogItem.updateAuthor.name === user) {
                var dateKey = new Date(new Date(workLogItem.started).toDateString());
                if (dateToLoggedHours.get(dateKey) == null) {
                    dateToLoggedHours.set(dateKey, new LoggedTime(workLogItem.timeSpentSeconds, issue.key));
                } else {
                    var log = dateToLoggedHours.get(dateKey);
                    log.log(workLogItem.timeSpentSeconds, issue.key)
                    // dateToLoggedHours.set(dateKey, (log + workLogItem.timeSpentSeconds));
                }
            }
        });
    });
    return dateToLoggedHours;
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
