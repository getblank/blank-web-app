import React from "react";
import moment from "moment";
import cx from "classnames";
import { useCurrentStore } from "hooks/useCurrentStore";
import MonthDayEvents from "./MonthDayEvents";

const MonthDay = ({ events, date, month, className, onClick }) => {
    const { storeDesc } = useCurrentStore();
    const { colorProp } = storeDesc;

    const labelClassName = cx("calendar-day-label", {
        "calendar-day-label-mute": date.month() !== month,
    });
    return (
        <div
            className={cx("calendar-weekday p-relative o-hidden d-flex flex-column", className)}
            onClick={(e) => onClick(e, date)}
        >
            {date.isSame(moment(), "day") && <div className="calendar-today p-absolute" />}
            <div className={labelClassName}>{date.date()}</div>
            <div className="d-flex flex-column grow">
                <MonthDayEvents events={events} colorProp={colorProp} />
            </div>
        </div>
    );
};

export default MonthDay;
