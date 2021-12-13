const moment = require('moment');
const TIME_MAX_END_OF_DAY = 20;
const TIME_MIN_START_OF_DAY = 6
const monthNames = ["january", "february", "march", "april", "nay", "june",
    "july", "august", "september", "october", "november", "december"];

class Helper {
    static getDateRange(monthName) {
        let month;
        if (monthName == null || monthNames.includes(monthName)) {
            month = new Date().getMonth();
        } else {
            month = monthNames.indexOf(monthName);
        }
        const startOfMonth = moment().month(month).startOf('month').hour(TIME_MIN_START_OF_DAY);
        const endOfMonth = moment().month(month).endOf('month').hour(TIME_MAX_END_OF_DAY);

        return {ts: startOfMonth.toDate(), te: endOfMonth.toDate()}
    }

    static getDateRange(year, monthIndex) {
        const startOfMonth = moment().year(year).month(monthIndex).startOf('month').hour(TIME_MIN_START_OF_DAY);
        const endOfMonth = moment().year(year).month(monthIndex).endOf('month').hour(TIME_MAX_END_OF_DAY);

        return {ts: startOfMonth.toDate(), te: endOfMonth.toDate()}
    }

    static isWeekend(day) {
        return day.getDay() == 6 || day.getDay() == 0;
    }

    static getLastFridayOf(day) {
        var d = new Date(day),
            day = d.getDay(),
            diff = (day <= 5) ? (7 - 5 + day) : (day - 5);

        d.setDate(d.getDate() - diff);
        d.setHours(0);
        d.setMinutes(0);
        d.setSeconds(0);

        return d;
    }

    static convertToHours(loggedTimeForADayInMs) {
        const HOUR = 3600;
        return Number(loggedTimeForADayInMs) / HOUR;
    }

    static formatDate(date) {
        let d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;

        return [year, month, day].join('-');
    }

    static getYearMonthIndex(date) {
        let d = new Date(date),
            month = d.getMonth(),
            year = d.getFullYear();
        return {year, month};
    }
}

module.exports = Helper
