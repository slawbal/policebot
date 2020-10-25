var Discord = require('discord.io');
var logger = require('winston');
var auth = require('../resources/auth.json');
var fs = require('fs');
var SortedMap = require("collections/sorted-map");
var jira = require("./boundry/outgoing/jira/jira-api");
const Helper = require('./helper');
var MessageBuilder = require("./texting/message-builder");
var ExcelBuilder = require("./texting/xlsx-builder");
const readline = require('readline');

// inner services
let messageBuilder = new MessageBuilder();
let excelBuilder = new ExcelBuilder();

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

        switch (cmd) {

            case 'wlog':
                var dStart = args[2];
                if (dStart == null) {
                    dStart = 7;
                }
                var dateFrom = new Date();
                dateFrom.setDate(dateFrom.getDate() - dStart);
                jira.getUserLoggedHoursFromDate(user, dateFrom, new Date()).then(resp => {
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
            case 'report':
                let month = args[2];
                let nameFile = args[3];
                const range = Helper.getDateRange(month);
                jira.getUserLoggedHoursFromDate(user, range.ts, range.te).then(resp => {
                    const daysToLoggedHours = jira.getWorkLog(resp, user);
                    const callBackUploadFile = function(fileName){
                        bot.uploadFile({to: channelID, file: fileName}, () => {
                            fs.unlinkSync(fileName)
                        });
                    };
                    excelBuilder.buildReportFile(daysToLoggedHours, range.ts, range.te, callBackUploadFile, nameFile);
                });
                break;
        }
    }
});
