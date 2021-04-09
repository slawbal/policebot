const Discord = require('discord.js');
const schedule = require('node-schedule');
const logger = require('winston');
const auth = require('../resources/auth.json');
const fs = require('fs');
const jira = require("./boundry/outgoing/jira/jira-api");
const Helper = require('./helper');
const MessageBuilder = require("./texting/message-builder");
const ExcelBuilder = require("./reporting/xlsx-builder");
const usersFile = fs.readFileSync('resources/users.json');
const userList = JSON.parse(usersFile);

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
const bot = new Discord.Client();
let usersFeedbackSent = [];
bot.login(auth.token)

bot.on('ready', function () {
    logger.info('Connected');
    schedule.scheduleJob('59 23 * * *', () => {
        console.log('Resetting list of users who received their daily feedback')
        usersFeedbackSent = []
    });
});

bot.on('voiceStateUpdate', (oldState, newState) => {
        const newVoiceStateChannel = newState.channelID
        const oldVoiceStateChannel = oldState.channelID
        const memberId = oldState.member.id;

        // Going from no channel connected to connected to one
        if (oldVoiceStateChannel === null && newVoiceStateChannel !== null) {
            // First connection to voice channel of the day
            if (!usersFeedbackSent.includes(memberId)) {
                const accountId = userList[memberId];

                let yesterday = new Date();
                yesterday.setDate(new Date().getDate() - 1);

                const lastWorkingDay = Helper.isWeekend(yesterday) ? Helper.getLastFridayOf(new Date()) : yesterday;

                let startLastWorkingDay = new Date(lastWorkingDay);
                startLastWorkingDay.setHours(0, 0, 0, 0);
                let endLastWorkingDay = new Date(lastWorkingDay)
                endLastWorkingDay.setHours(23, 59, 59, 999);

                jira.getUserLoggedHoursFromDate(accountId, startLastWorkingDay, endLastWorkingDay).then(resp => {
                    const loggedHoursYesterday = jira.getWorkLog(resp, accountId);
                    const log = loggedHoursYesterday.get(Helper.formatDate(lastWorkingDay));
                    const hoursLogged = log ? Helper.convertToHours(log.time) : 0;
                    oldState.member.send(messageBuilder.buildFeedbackMessage(hoursLogged, oldState.member.displayName));
                    usersFeedbackSent.push(memberId);
                });
            }
        }
    }
);

bot.on('message', msg => {
    const messageContent = msg.content;
    const authorId = msg.author.id;
    const channel = msg.channel
    logger.info('chan id: ' + channel.name);

    if (messageContent.substring(0, 1) == '!') {
        const args = messageContent.substring(1).split(' ');
        const cmd = args[0];
        const user = args[1];

        if (user) {
            jira.getUserByUsername(user).then(jiraUser => {
                if (jiraUser && jiraUser.length) {
                    handleCommand(cmd, jiraUser[0].accountId, channel, args)
                } else {
                    feedbackUserNotFound(channel)
                }
            })
        } else {
            let accountId = userList[authorId];
            if (accountId) {
                handleCommand(cmd, accountId, channel, args)
            } else {
                feedbackUserNotFound(channel);
            }
        }
    }
});

function feedbackUserNotFound() {
    const error = new Discord.MessageEmbed()
        .setTitle("Hours report")
        .setColor("DARK_RED")
        .setDescription("User not found")
    channel.send(error);
}

function handleCommand(cmd, accountId, channel, args) {
    switch (cmd) {
        case 'wlog':
            let dStart = args[2];
            if (dStart == null) {
                dStart = 7;
            }
            const dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - dStart);

            jira.getUserLoggedHoursFromDate(accountId, dateFrom, new Date()).then(resp => {
                const daysToLoggedHours = jira.getWorkLog(resp, accountId);

                let message = messageBuilder.buildLoggedHoursMessage(daysToLoggedHours, dateFrom);
                const messageEmbed = new Discord.MessageEmbed()
                    .setTitle("Hours report")
                    .setColor(3447003)
                    .setDescription(message)
                channel.send(messageEmbed);
            });

            break;
        case 'status':
            jira.healthCheck().then(resp => {
                let message = messageBuilder.buildHealthMessage(resp);
                const messageEmbed = new Discord.MessageEmbed()
                    .setTitle("Health check")
                    .setColor(3447003)
                    .setDescription(message)
                channel.send(messageEmbed);
            });
            break;
        case 'report':
            let month = args[2];
            let nameFile = args[3];
            const range = Helper.getDateRange(month);
            jira.getUserLoggedHoursFromDate(accountId, range.ts, range.te).then(resp => {
                const daysToLoggedHours = jira.getWorkLog(resp, accountId);
                const callBackUploadFile = function (fileName) {
                    channel.send({
                        files: [fileName]
                    })
                };
                excelBuilder.buildReportFile(daysToLoggedHours, range.ts, range.te, callBackUploadFile, nameFile);
            });
            break;
    }
}
