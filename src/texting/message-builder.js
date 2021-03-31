const fs = require('fs');
const Helper = require('../helper');

good = ":white_check_mark:";
bad = ":x:";
tooGood = ":hammer_pick:";
weekend = ":island:";

noReporting = 'You forgot to log your hours yesterday :frowning: Please try to do it as soon as possible.';
uncompleteReporting = 'You logged some hours yesterday but it does not reach 8, please try to fill the blank :+1:';
completeReporting = 'Good job for logging your hours yesterday :clap: Keep up the good work! ';

let cfgFile = fs.readFileSync('resources/config.json');
let config = JSON.parse(cfgFile);
let url = config.jira.address;

class MessageBuilder {

    buildHealthMessage(resp) {
        var jiraStatus = "JIRA: "
        if (resp == 200) {
            jiraStatus += "OK :green_circle:";
        } else {
            jiraStatus += "ERROR :red_circle:";
        }
        return "Status: \n" + jiraStatus;
    }

    buildFeedbackMessage(hoursLogged, username) {
        let message = 'Good morning ' + username + ' :spy: \n';
        if (hoursLogged === 0) {
            message = message + noReporting;
        } else if (hoursLogged < 8) {
            message = message + uncompleteReporting;
        } else if (hoursLogged === 8) {
            message = message + completeReporting;
        }
        return message;
    }

    buildLoggedHoursMessage(myMap, dateFrom) {

        var message = "";
        this.iterateOverEachDayFrom(dateFrom, function (day) {
            var loggedTimeForADayInMs = 0;
            var issueList;
            var log = myMap.get(Helper.formatDate(day));
            if (log != null) {
                loggedTimeForADayInMs = log.time;
                issueList = log.issueId.split(",");
            }

            var timeLoggedForADay = Helper.convertToHours(loggedTimeForADayInMs);

            var sign = MessageBuilder.getSign(timeLoggedForADay);
            if (Helper.isWeekend(day)) {
                sign = weekend;
            }

            message = message + `${sign}  ${day.toDateString()} = ${timeLoggedForADay}h |` + MessageBuilder.getLinks(issueList) + "\n";

            if (MessageBuilder.isLastDayOfTheWeek(day)) {
                message = message + "---------------------\n";
            }
        });
        return message;
    }

    static getLinks(issues) {
        var links = "";
        if (issues != null) {
            issues.forEach(i => {
                links += "[" + i + "]" + "(" + url + "/browse/" + i + ") ";
            });
        }
        return links;
    }

    static isLastDayOfTheWeek(day) {
        return day.getDay() == 0;
    }



    static getSign(loggedHours) {
        var sign = "";
        if (loggedHours === 8) {
            sign = good;
        } else if (loggedHours < 8) {
            sign = bad;
        } else if (loggedHours > 8) {
            sign = tooGood;
        }
        return sign;
    }

    iterateOverEachDayFrom(dateFrom, doTheStuff) {
        for (var d = dateFrom; d <= Date.now(); d.setDate(d.getDate() + 1)) {
            doTheStuff(d);
        }
    }

}

module.exports = MessageBuilder
