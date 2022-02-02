import React from "react";
import cx from "classnames";
import moment from "moment";
import { useCurrentStore } from "hooks/useCurrentStore";
import DayEvents from "./DayEvents";
import MonthDay from "./MonthDay";

const WeekDays = () =>
    new Array(7).fill().map((_, i) => (
        <div className="d-flex align-center transform-capitalize">
            {moment()
                .isoWeekday(i + 1)
                .format("ddd")}
        </div>
    ));

const Month = ({ year, month, day, getEvents, onDateChange, create, select }) => {
    const { storeDesc } = useCurrentStore();
    const { dateProp, endDateProp } = storeDesc;

    const dayClickHandler = (e, date, selected) => {
        if (selected) {
            const data = {};
            const d = moment(date).hour(12).minute(0);
            data[dateProp] = d.toISOString();
            data[endDateProp] = d.add(60, "minutes").toISOString();
            return create(data);
        }
        onDateChange(date);
    };

    const start = moment([year, month]);
    start.isoWeekday(1);

    const newWeeks = [];
    for (let i = 0; i < 42; i++) {
        if (i % 7 === 0) {
            newWeeks.push([]);
        }
        const currentWeek = newWeeks[newWeeks.length - 1];
        const date = moment(start);
        const selected = date.isSame(moment([year, month, day]), "day");
        currentWeek.push(
            <MonthDay
                key={i}
                onClick={dayClickHandler}
                date={date}
                month={month}
                events={getEvents(date)}
                className={cx({ "calendar-selected-day": selected })}
            />,
        );
        start.add(1, "days");
    }

    return (
        <div className="calendar-container grow">
            <div className="calendar-week calendar-line-header">
                <WeekDays />
            </div>
            <div className="event-header d-flex align-center">{moment([year, month, day]).format("LL")}</div>
            <div className="daily-events">
                <DayEvents events={getEvents(moment([year, month, day]))} onEventClick={select} />
            </div>

            {newWeeks.map((days, i) => {
                const lineClass = `calendar-week line${i + 1}`;
                return (
                    <div key={i} className={lineClass}>
                        {days}
                    </div>
                );
            })}
        </div>
    );
};

export default Month;
