
const moment = require('moment');
const TIME_MAX_END_OF_DAY = 20;
const TIME_MIN_START_OF_DAY = 6
const monthNames = ["january", "february", "march", "april", "nay", "june",
    "july", "august", "september", "october", "november", "december"];

class Helper{
    static getDateRange(monthName){
        let month;
        if (monthName == null) {
            month = new Date().getMonth();
        } else {
            month = monthNames.indexOf(monthName);
        }
        const startOfMonth = moment().month(month).startOf('month').hour(TIME_MIN_START_OF_DAY);
        const endOfMonth   = moment().month(month).endOf('month').hour(TIME_MAX_END_OF_DAY);

        return {ts: startOfMonth.toDate(), te: endOfMonth.toDate()}
    }

    static isWeekend(day) {
        return day.getDay() == 6 || day.getDay() == 0;
    }

    static convertToHours(loggedTimeForADayInMs) {
        const HOUR = 3600;
        return Number(loggedTimeForADayInMs) / HOUR;
    }
}


module.exports = Helper