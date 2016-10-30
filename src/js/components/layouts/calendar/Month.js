import React from "react";
import moment from "moment";

const CALENDAR_DAY_CLASS = "calendarDay-GMDA743";
//Need to render week days every time because of moment locale setup is running after this module require
const getWeekDays = () => (
    [1, 2, 3, 4, 5, 6, 7].map(d => (
        <div style={Object.assign({}, s.weekDay, d > 50 && s.holiday)}
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
    },
    selectedDayHeader: {
        paddingLeft: "4px",
    },
    weekDay: {
        flex: "2 0",
        paddingLeft: "4px",
    },
    calendarDay: {
        flex: "2 0",
        // borderRight: "1px solid rgba(0,0,0,.12)",
        padding: "4px",
    },
    selectedCalendarDay: {
        backgroundColor: "#EDE7F6",
    },
    mute: {
        color: "#aaa",
    },
    holiday: {
        color: "#F44336",
    },
    today: {
        borderTop: "4px solid #2196F3",
    },
};

const Month = ({year, month, day, onDayChange, onDateChange}) => {
    const dayClickHandler = (e) => {
        onDateChange(e.target.getAttribute("data-date"));
    };
    const start = moment([year, month]);
    start.isoWeekday(1);
    const controls = [];
    let week = [];
    for (let i = 0; i < 42; i++) {
        var dayStyle = Object.assign({},
            s.calendarDay,
            start.isSame(moment([year, month, day]), "day") && s.selectedCalendarDay,
            start.month() !== month && s.mute,
            // start.isoWeekday() > 5 && s.holiday,
            start.isSame(moment(), "day") && s.today);
        week.push(
            <div
                style={dayStyle}
                className={CALENDAR_DAY_CLASS}
                data-date={start.toISOString()}
                onClick={dayClickHandler}
                key={"d-" + i % 7}>
                {start.date()}
            </div>
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
                .${CALENDAR_DAY_CLASS}:hover {
                    background-color: #f0f0f0
                }`}</style>
            <div style={s.calendarWrapper}>
                <div style={s.headerRow}>
                    {getWeekDays()}
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
                </div>
            </div>
        </div>
    );
};

export default Month;