import React from "react";
import LabelsContainer from "../../labels/LabelsContainer";
import ItemActions from "../../../actions/itemsActuators";

const CALENDAR_DAY_SELECTED_CLASS = "calendarDay-GMDA743";
//Need to render week days every time because of moment locale setup is running after this module require
const getWeekDays = (start, moment) => (
    [1, 2, 3, 4, 5, 6, 7].map(d => {
        const m = start.isoWeekday(d);
        const style = Object.assign({}, s.weekDayLabel);
        if (m.isSame(moment(), "day")) {
            style.borderBottom = "4px solid #2196F3";
        }
        return (
            <div style={style}
                key={"dw-" + d}>
                <span style={{ color: "rgba(0,0,0,.54)", marginRight: "10px" }}>{m.date()}</span>
                {m.format("dddd")}
            </div>
        );
    })
);

const s = {
    wrapper: {
        display: "flex",
        width: "100%",
        minWidth: "1024px",
    },
    calendarWrapper: {
        flex: "0 0 100%",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(0,0,0,.12)",
    },
    dayWrapper: {
        flex: "2 0",
        display: "flex",
        flexDirection: "column",
        minWidth: "0px",
    },
    headerRow: {
        flex: "0 0 32px",
        display: "flex",
        lineHeight: "32px",
    },
    daysRow: {
        overflowY: "scroll",
    },
    weekDayLabel: {
        flex: "2 0",
        borderBottom: "4px solid transparent",
        borderLeft: "1px solid transparent",
        paddingLeft: "4px",
    },
    hourRow: {
        display: "flex",
        borderTop: "1px solid rgba(0,0,0,.12)",
        minHeight: "38px",
    },
    hourLabel: {
        flex: "0 0 56px",
        padding: "4px 7px",
    },
    hourData: {
        flex: "2 0",
        padding: "4px 4px 14px 4px",
        borderLeft: "1px solid rgba(0,0,0,.12)",
        backgroundColor: "#fff",
        overflowX: "auto",
        cursor: "copy",
    },
    today: {

    },

    //Events
    event: {
        marginBottom: "4px",
        padding: "7px",
        minWidth: "0px",
        backgroundColor: "#E8F5E9",
        borderRadius: "3px",
        cursor: "pointer",
    },
    eventTitle: {
        display: "block",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    eventLabels: {
        marginTop: "4px",
        fontSize: ".9rem",
    },
};

const Week = ({moment, year, month, day, dateProp, colorProp, endDateProp, getEvents, onDayChange, onDateChange, create, select}) => {
    const hourClickHandler = (e, date, selected) => {
        const target = e.currentTarget;
        console.log("hourClickHandler", target.dataset.day, "/", target.dataset.hour);
        const data = {};
        const d = moment([year, month, day]).isoWeekday(target.dataset.day * 1).hour(target.dataset.hour * 1);
        console.log(">>>>>", d.date());
        data[dateProp] = d.toISOString();
        data[endDateProp] = d.add(60, "minutes").toISOString();
        return create(data);
    };
    const eventClickHandler = (e) => {
        e.stopPropagation();
        ItemActions.select(e.currentTarget.dataset.id);
    };
    const mouseOverHandler = (e) => {
        if (e.target === e.currentTarget) {
            e.currentTarget.style.backgroundColor = "#f0f0f0";
        }
    };
    const mouseOutHandler = (e) => {
        e.currentTarget.style.backgroundColor = "#fff";
    };

    const start = moment([year, month, day]);
    start.isoWeekday(1);
    let week = [];
    for (let i = 0; i < 24; i++) {
        start.hours(i);
        week.push(
            <div style={s.hourRow} key={"h-" + i}>
                <div style={s.hourLabel}>
                    <span>{start.format("HH:mm")}</span>
                </div>
                {[1, 2, 3, 4, 5, 6, 7].map(_day => {
                    start.isoWeekday(_day);
                    const events = getEvents(start, i);
                    return (
                        <div
                            key={"hd-" + i + "-" + _day}
                            style={s.hourData}
                            onClick={hourClickHandler}
                            data-day={_day}
                            data-hour={i}
                            onMouseOver={mouseOverHandler}
                            onMouseOut={mouseOutHandler}
                            >
                            {events.map(event => {
                                const eventStyle = Object.assign({}, s.event);
                                if (event[colorProp]) {
                                    eventStyle.backgroundColor = event[colorProp];
                                }
                                return (
                                    <div
                                        key={event._id}
                                        style={eventStyle}
                                        onClick={eventClickHandler}
                                        data-id={event._id}>
                                        <span style={s.eventTitle}>{event.name}</span>
                                        <div style={s.eventLabels}>
                                            <LabelsContainer item={event} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        );
    }
    return (
        <div style={s.wrapper}>
            <style>{`
                .${CALENDAR_DAY_SELECTED_CLASS} {
                    background-color: #EDE7F6 !important;
                }`}</style>
            <div style={s.calendarWrapper}>
                <div style={s.headerRow}>
                    <div style={s.hourLabel}></div>
                    {getWeekDays(moment([year, month, day]), moment)}
                    <div style={{ width: "15px" }}></div>
                </div>
                <div style={s.daysRow}>
                    {week}
                </div>
            </div>
        </div>
    );
};

export default Week;