const excel = require('excel4node');
const Helper = require('../helper');

class ExcelBuilder {
    DATE_COLUMN_INDEX = 1; DATE_COLUMN_WIDTH = 20;
    STATUS_COLUMN_INDEX = 2; STATUS_COLUMN_WIDTH = 20;
    START_COLUMN_INDEX = 3; START_COLUMN_WIDTH = 15;
    END_COLUMN_INDEX = 4; END_COLUMN_WIDTH = 15;
    TOTAL_HOURS_COLUMN_INDEX = 5; TOTAL_HOURS_COLUMN_WIDTH = 25;
    TASKS_COLUMN_INDEX = 6; TASKS_COLUMN_WIDTH = 50;

    headerStyle;
    statusOffStyle;
    statusWorkingStyle;

    buildReportFile(myMap, timeStart, timeEnd, uploadFunction, nameFile = `excel_report_${Math.floor(Math.random() * 1000)}`){
        const wb = new excel.Workbook({
            dateFormat: 'dd/mm/yyyy'
        });
        const ws = wb.addWorksheet('Hours report');

        this.setWidth(ws);
        this.createStyles(wb)
        this.buildHeader(ws, this.headerStyle);
        let row = 2;
        for (let day = timeStart; day <= timeEnd; day.setDate(day.getDate() + 1)) {
            let log = myMap.get(Helper.formatDate(day))
            this.buildRow(ws, day, row++, log);
        }

        const fileWithExtension = `${nameFile}.xlsx`;
        wb.write(fileWithExtension, () => {
            uploadFunction(fileWithExtension);
        });
    }

    buildRow(ws, date, row, log){
        const isWeekend = Helper.isWeekend(date)
        ws.cell(row, this.DATE_COLUMN_INDEX)
            .date(date);
        ws.cell(row, this.STATUS_COLUMN_INDEX)
            .string(isWeekend? 'Off' : 'Working').style(isWeekend? this.statusOffStyle: this.statusWorkingStyle);
        ws.cell(row, this.START_COLUMN_INDEX)
            .string('8:00');
        ws.cell(row, this.END_COLUMN_INDEX)
            .string('16:00');

        if(log && log.time && !isWeekend){
            ws.cell(row, this.TOTAL_HOURS_COLUMN_INDEX)
                .number(Helper.convertToHours(log.time));
        }
        ws.cell(row, this.TASKS_COLUMN_INDEX)
            .string(log && log.issueId ? log.issueId.replace(/,/g, ", "): '-')
    }

    setWidth(ws){
        ws.column(this.DATE_COLUMN_INDEX).setWidth(this.DATE_COLUMN_WIDTH);
        ws.column(this.STATUS_COLUMN_INDEX).setWidth(this.STATUS_COLUMN_WIDTH);
        ws.column(this.START_COLUMN_INDEX).setWidth(this.START_COLUMN_WIDTH);
        ws.column(this.END_COLUMN_INDEX).setWidth(this.END_COLUMN_WIDTH);
        ws.column(this.TOTAL_HOURS_COLUMN_INDEX).setWidth(this.TOTAL_HOURS_COLUMN_WIDTH);
        ws.column(this.TASKS_COLUMN_INDEX).setWidth(this.TASKS_COLUMN_WIDTH);
    }

    createStyles(wb){
        this.headerStyle = wb.createStyle({
            font: {
                color: '#006100',
                size: 15,
            },
            fill: {
                type: 'pattern',
                patternType: 'darkUp',
                backgroundColor:  '#c6efce',
                fgColor: '#c6efce'
            }
        });

        this.statusOffStyle = wb.createStyle({
            fill: {
                type: 'pattern',
                patternType: 'darkUp',
                backgroundColor:  '#ffc7ce',
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
    }

    buildHeader(ws, headerStyle){
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
}

module.exports = ExcelBuilder