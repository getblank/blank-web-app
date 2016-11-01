import React from "react";
import MonthDayEvents from "./MonthDayEvents";

const s = {
    calendarDay: {
        flex: "2 0",
        display: "flex",
        flexDirection: "column",
        padding: "4px",
        //Workaround for flex children text-overflow
        minWidth: 0,
        // borderRight: "1px solid rgba(0,0,0,.12)",
    },
    calendarDayDate: {
        flex: "0 0",
        fontSize: "1.3rem",
        fontWeight: 100,
    },
    events: {
        flex: "2 0",
        display: "flex",
        flexDirection: "column",
    },
    selectedCalendarDay: {
        backgroundColor: "#EDE7F6",
    },
    mute: {
        color: "#aaa",
    },
    today: {
        borderTop: "4px solid #2196F3",
    },
};

const MonthDay = ({moment, date, month, selected, events, className, onClick}) => {
    const dayClickHandler = (e) => {
        onClick(e, date, selected);
    };
    const mouseOverHandler = (e) => {
        e.currentTarget.style.backgroundColor = "#f0f0f0";
    };
    const mouseOutHandler = (e) => {
        e.currentTarget.style.backgroundColor = "";
    };
    const dayStyle = Object.assign({},
        s.calendarDay,
        date.month() !== month && s.mute,
        date.isSame(moment(), "day") && s.today,
        {
            cursor: selected ? "copy" : "pointer",
        });
    return (
        <div
            style={dayStyle}
            onClick={dayClickHandler}
            onMouseOver={mouseOverHandler}
            onMouseOut={mouseOutHandler}
            className={className}>
            <span style={s.calendarDayDate}>{date.date()}</span>
            <div style={s.events}>
                <MonthDayEvents events={events} />
            </div>
        </div>
    );
};

export default MonthDay;