const excel = require('excel4node');
const Helper = require('../helper');

class ExcelBuilder {

    months_polish = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Pazdziernik', 'Listopad', 'Grudzień'];

    // Cell information weekly report
    DATE_COLUMN_INDEX = 1;
    START_ROW_DAYS = 2;
    DATE_COLUMN_WIDTH = 20;
    STATUS_COLUMN_INDEX = 2;
    STATUS_COLUMN_WIDTH = 20;
    START_COLUMN_INDEX = 3;
    START_COLUMN_WIDTH = 15;
    END_COLUMN_INDEX = 4;
    END_COLUMN_WIDTH = 15;
    TOTAL_HOURS_COLUMN_INDEX = 5;
    TOTAL_HOURS_COLUMN_WIDTH = 25;
    TASKS_COLUMN_INDEX = 6;
    TASKS_COLUMN_WIDTH = 50;
    SUM_COLUMN_INDEX = 1;

    //Cell information yearly report
    YEAR_COLUMN_INDEX = 1;
    MONTH_COLUMN_INDEX = 2;
    DESCRIPTION_COLUMN_INDEX = 3;
    JIRA_COLUMN_INDEX = 4;
    COMMIT_COLUMN_INDEX = 5;
    TIME_COLUMN_INDEX = 6;

    YEAR_COLUMN_WIDTH = 10;
    MONTH_COLUMN_WIDTH = 10;
    DESCRIPTION_COLUMN_WIDTH = 100;
    JIRA_COLUMN_WIDTH = 10;
    COMMIT_COLUMN_WIDTH = 20;
    TIME_COLUMN_WIDTH = 10;

    HEIGHT_LINE = 12;

    WORKING_LABEL = 'Working';
    OFF_LABEL = 'Off'

    WORKING_TIME_PER_DAY = 8; // Could be param in config file

    headerStyle;
    statusOffStyle;
    statusWorkingStyle;

    centerTextStyle;

    buildReportFile(myMap, timeStart, timeEnd, uploadFunction, nameFile = `excel_report_${Math.floor(Math.random() * 1000)}`) {
        let totalHours = 0;
        const wb = new excel.Workbook({
            dateFormat: 'dd/mm/yyyy'
        });
        const ws = wb.addWorksheet('Hours report');

        this.setWidth(ws);
        this.createStyles(wb)
        this.buildHeaderReport(ws, this.headerStyle);
        let row = this.START_ROW_DAYS;
        for (let day = timeStart; day <= timeEnd; day.setDate(day.getDate() + 1)) {
            let log = myMap.get(Helper.formatDate(day))
            totalHours += this.buildRow(ws, day, row++, log);
        }
        this.buildSummary(ws, row, totalHours);

        const fileWithExtension = `${nameFile}.xlsx`;
        wb.write(fileWithExtension, () => {
            uploadFunction(fileWithExtension);
        });
    }


    buildSummary(ws, currentRow, totalHours) {
        let startRangeDays = excel.getExcelCellRef(this.START_ROW_DAYS, this.STATUS_COLUMN_INDEX);
        let endRangeDays = excel.getExcelCellRef(currentRow - 1, this.STATUS_COLUMN_INDEX);

        ws.cell(currentRow, this.SUM_COLUMN_INDEX).string('SUM').style(this.headerStyle);
        for (let i = this.SUM_COLUMN_INDEX + 1; i < this.TOTAL_HOURS_COLUMN_INDEX; i++) {
            ws.cell(currentRow, i).string('').style(this.headerStyle);
        }
        ws.cell(currentRow, this.TOTAL_HOURS_COLUMN_INDEX).number(totalHours).style(this.headerStyle);
        const rowNetWorkingDays = currentRow + 2
        ws.cell(rowNetWorkingDays, 1).string('NET WORKING DAYS')
        ws.cell(rowNetWorkingDays, 2).formula(`COUNTIF(${startRangeDays}:${endRangeDays},"${this.WORKING_LABEL}")`)

        let netWorkingDayResultCell = excel.getExcelCellRef(rowNetWorkingDays, 2);
        const rowNetWorkingHours = currentRow + 3

        ws.cell(rowNetWorkingHours, 1).string('NET WORKING HOURS')
        ws.cell(rowNetWorkingHours, 2).formula(`${this.WORKING_TIME_PER_DAY} *${netWorkingDayResultCell}`)
    }

    buildRow(ws, date, row, log) {
        const isWeekend = Helper.isWeekend(date);
        let totalHoursDaily = 0;
        ws.cell(row, this.DATE_COLUMN_INDEX)
            .date(date);
        ws.cell(row, this.STATUS_COLUMN_INDEX)
            .string(isWeekend ? this.OFF_LABEL : this.WORKING_LABEL).style(isWeekend ? this.statusOffStyle : this.statusWorkingStyle);
        ws.cell(row, this.START_COLUMN_INDEX)
            .string('8:00');
        ws.cell(row, this.END_COLUMN_INDEX)
            .string('16:00');

        if (log && log.time && !isWeekend) {
            totalHoursDaily = Helper.convertToHours(log.time)
            ws.cell(row, this.TOTAL_HOURS_COLUMN_INDEX)
                .number(totalHoursDaily);
        }
        ws.cell(row, this.TASKS_COLUMN_INDEX)
            .string(log && log.issueId ? log.issueId.replace(/,/g, ", ") : '-')

        return totalHoursDaily;
    }

    setWidth(ws) {
        ws.column(this.DATE_COLUMN_INDEX).setWidth(this.DATE_COLUMN_WIDTH);
        ws.column(this.STATUS_COLUMN_INDEX).setWidth(this.STATUS_COLUMN_WIDTH);
        ws.column(this.START_COLUMN_INDEX).setWidth(this.START_COLUMN_WIDTH);
        ws.column(this.END_COLUMN_INDEX).setWidth(this.END_COLUMN_WIDTH);
        ws.column(this.TOTAL_HOURS_COLUMN_INDEX).setWidth(this.TOTAL_HOURS_COLUMN_WIDTH);
        ws.column(this.TASKS_COLUMN_INDEX).setWidth(this.TASKS_COLUMN_WIDTH);
    }

    buildHeaderReport(ws, headerStyle) {
        ws.cell(1, this.DATE_COLUMN_INDEX)
            .string('Date').style(headerStyle)
        ws.cell(1, this.STATUS_COLUMN_INDEX)
            .string('Status').style(headerStyle)
        ws.cell(1, this.START_COLUMN_INDEX)
            .string('Start').style(headerStyle)
        ws.cell(1, this.END_COLUMN_INDEX)
            .string('End').style(headerStyle)
        ws.cell(1, this.TOTAL_HOURS_COLUMN_INDEX)
            .string('Total Hours Worked').style(headerStyle)
        ws.cell(1, this.TASKS_COLUMN_INDEX)
            .string('Tasks').style(headerStyle)
    }


    createStyles(wb) {
        this.headerStyle = wb.createStyle({
            font: {
                color: '#006100',
                size: 15,
            },
            fill: {
                type: 'pattern',
                patternType: 'darkUp',
                backgroundColor: '#c6efce',
                fgColor: '#c6efce'
            }
        });

        this.statusOffStyle = wb.createStyle({
            fill: {
                type: 'pattern',
                patternType: 'darkUp',
                backgroundColor: '#ffc7ce',
                fgColor: '#ffc7ce'
            },
            alignment: {
                wrapText: true,
                horizontal: 'center',
            },
        })

        this.statusWorkingStyle = wb.createStyle({
            alignment: {
                wrapText: true,
                horizontal: 'center',
            },
        });

        this.centerTextStyle = wb.createStyle({
            alignment: {
                wrapText: true,
                horizontal: 'center',
                vertical: 'center',
            },
        })
    }


    buildYearlyReportFile(infoIssuesMonthly, year, uploadFunction, nameReport = `excel_yearly_report_${Math.floor(Math.random() * 1000)}`) {
        const wb = new excel.Workbook({
            dateFormat: 'dd/mm/yyyy'
        })

        const ws = wb.addWorksheet('Ewidencja projektwa');
        this.setYearlyReportWidth(ws);
        this.createStyles(wb)
        this.buildHeaderReportYearly(ws, this.headerStyle);

        infoIssuesMonthly.forEach((issuesByMonth, index) => {
            this.buildRowYearlyReport(ws, year, this.months_polish[index], index + 2, issuesByMonth);
        });

        const fileWithExtension = `${nameReport}.xlsx`;
        wb.write(fileWithExtension, () => {
            uploadFunction(fileWithExtension);
        });
    }

    buildRowYearlyReport(ws, year, month, row, issuesByMonth) {
        ws.cell(row, this.YEAR_COLUMN_INDEX).string(year).style(this.centerTextStyle);
        ws.cell(row, this.MONTH_COLUMN_INDEX).string(month).style(this.centerTextStyle);
        ws.cell(row, this.DESCRIPTION_COLUMN_INDEX).string(issuesByMonth.map(issues => issues.description).join("\n"))
        ws.cell(row, this.JIRA_COLUMN_INDEX).string(issuesByMonth.map(issues => issues.key).join("\n"))
        ws.cell(row, this.TIME_COLUMN_INDEX).string(issuesByMonth.map(issues => issues.timeLogged).join("\n"))
        ws.row(row).setHeight(issuesByMonth.length * this.HEIGHT_LINE);
    }

    setYearlyReportWidth(ws) {
        ws.column(this.YEAR_COLUMN_INDEX).setWidth(this.YEAR_COLUMN_WIDTH);
        ws.column(this.MONTH_COLUMN_INDEX).setWidth(this.MONTH_COLUMN_WIDTH);
        ws.column(this.DESCRIPTION_COLUMN_INDEX).setWidth(this.DESCRIPTION_COLUMN_WIDTH);
        ws.column(this.JIRA_COLUMN_INDEX).setWidth(this.JIRA_COLUMN_WIDTH);
        ws.column(this.COMMIT_COLUMN_INDEX).setWidth(this.COMMIT_COLUMN_WIDTH);
        ws.column(this.TIME_COLUMN_INDEX).setWidth(this.TIME_COLUMN_WIDTH);
    }

    buildHeaderReportYearly(ws, headerStyle) {
        ws.cell(1, this.YEAR_COLUMN_INDEX)
            .string('Rok').style(headerStyle)
        ws.cell(1, this.MONTH_COLUMN_INDEX)
            .string('Miesiac').style(headerStyle)
        ws.cell(1, this.DESCRIPTION_COLUMN_INDEX)
            .string('Opis').style(headerStyle)
        ws.cell(1, this.JIRA_COLUMN_INDEX)
            .string('Jira').style(headerStyle)
        ws.cell(1, this.COMMIT_COLUMN_INDEX)
            .string('Numer commita - nazwa repozytorium').style(headerStyle)
        ws.cell(1, this.TIME_COLUMN_INDEX)
            .string('Czas').style(headerStyle)
    }

}

module.exports = ExcelBuilder