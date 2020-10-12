var Discord = require('discord.io');
var logger = require('winston');
var auth = require('../resources/auth.json');

var SortedMap = require("collections/sorted-map");
var jira = require("./boundry/outgoing/jira/jira-api");
var MessageBuilder = require("./texting/message-builder")
const readline = require('readline');
var messageBuilder = new MessageBuilder();

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});

logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
    token: auth.token,
    autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function (user, userID, channelID, message, evt) {

    logger.info('chan id: ' + channelID);
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];

        var user = args[1];

        var dStart = args[2];
        if (dStart == null) {
            dStart = 7;
        }
        var dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - dStart);

        switch (cmd) {

            case 'wlog':
                jira.getUserLoggedHoursFromDate(user, dateFrom).then(resp => {
                    var daysToLoggedHours = jira.getWorkLog(resp, user);

                    let message = messageBuilder.buildLoggedHoursMessage(daysToLoggedHours, dateFrom);
                    bot.sendMessage({
                        to: channelID,
                        embed: {
                            color: 3447003,
                            description: message
                        }
                    });

                });
                break;
            case 'status':
                jira.healthCheck().then(resp => {
                    let message = messageBuilder.buildHealthMessage(resp);
                    bot.sendMessage({
                        to: channelID,
                        embed: {
                            color: 3447003,
                            description: message
                        }
                    });
                });

                break;

        }
    }
});
