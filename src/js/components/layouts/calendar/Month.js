import React from "react";
import SimpleList from "../../misc/SimpleList";
import MonthDay from "./MonthDay";
import DayEvents from "./DayEvents";

const CALENDAR_DAY_SELECTED_CLASS = "calendarDay-GMDA743";
//Need to render week days every time because of moment locale setup is running after this module require
const getWeekDays = (moment) => (
    [1, 2, 3, 4, 5, 6, 7].map(d => (
        <div style={s.weekDay}
            key={"dw-" + d}>
            {moment().isoWeekday(d).format("dddd")}
        </div>
    ))
);

const s = {
    wrapper: {
        display: "flex",
        width: "100%",
        minWidth: "1024px",
    },
    calendarWrapper: {
        flex: "0 0 70%",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(0,0,0,.12)",
    },
    dayWrapper: {
        flex: "0 0 30%",
        display: "flex",
        flexDirection: "column",
        minWidth: "0px",
    },
    headerRow: {
        flex: "0 0 32px",
        display: "flex",
        lineHeight: "32px",
    },
    caledarRow: {
        flex: "2 0",
        display: "flex",
        borderTop: "1px solid rgba(0,0,0,.12)",
        backgroundColor: "#fff",
    },
    selectedDay: {
        flex: "2 0",
        backgroundColor: "#fff",
        borderTop: "1px solid rgba(0,0,0,.12)",
        overflow: "auto",
    },
    selectedDayHeader: {
        paddingLeft: "4px",
    },
    weekDay: {
        flex: "2 0",
        paddingLeft: "4px",
    },
};

const Month = ({moment, year, month, day, dateProp, getEvents, onDayChange, onDateChange, create, select}) => {
    const dayClickHandler = (e, date, selected) => {
        if (selected) {
            const data = {};
            data[dateProp] = moment(date).hour(12).minute(0).toISOString();
            return create(data);
        }
        onDateChange(date);
    };
    const start = moment([year, month]);
    start.isoWeekday(1);
    const controls = [];
    let week = [];
    for (let i = 0; i < 42; i++) {
        const date = moment(start);
        const selected = date.isSame(moment([year, month, day]), "day");
        week.push(
            <MonthDay
                key={"d-" + i % 7}
                moment={moment}
                date={date}
                month={month}
                events={getEvents(date)}
                selected={selected}
                className={selected ? CALENDAR_DAY_SELECTED_CLASS : ""}
                onClick={dayClickHandler}
                />
        );
        if (i % 7 === 6) {
            controls.push(
                <div key={"w-" + Math.floor(i / 7)} style={s.caledarRow} >
                    {week}
                </div>
            );
            week = [];
        }
        start.add(1, "days");
    }
    return (
        <div style={s.wrapper}>
            <style>{`
                .${CALENDAR_DAY_SELECTED_CLASS} {
                    background-color: #EDE7F6 !important;
                }`}</style>
            <div style={s.calendarWrapper}>
                <div style={s.headerRow}>
                    {getWeekDays(moment)}
                </div>
                {controls}
            </div>
            <div style={s.dayWrapper}>
                <div style={s.headerRow}>
                    <div style={s.selectedDayHeader}>
                        {moment([year, month, day]).format("LL")}
                    </div>
                </div>
                <div style={s.selectedDay}>
                    <DayEvents
                        events={getEvents(moment([year, month, day]))}
                        dateProp="dateTime"
                        moment={moment}
                        onEventClick={select}
                        />
                </div>
            </div>
        </div>
    );
};

export default Month;