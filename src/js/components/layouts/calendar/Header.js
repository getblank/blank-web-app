import React from "react";
import moment from "moment";
import stilist from "stilist";
import cx from "classnames";

const getMonthOptions = () => {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(m => (
        <option value={m} key={"m-" + m}>{moment().month(m).format("MMMM")}</option>
    ));
};

const getYearOptions = (year) => {
    var diff = 10;
    var res = [];
    for (let i = Math.max(year - diff, 0); i < year + diff; i++) {
        res.push((
            <option value={i} key={"y-" + i}>{i}</option>
        ));
    }
    return res;
};

const s = {
    wrapper: {
        display: "flex",
        alignItems: "center",
        padding: "7px 0",
        backgroundColor: "#fff",
    },
    days: {
        fontSize: "1.4rem",
        marginRight: "14px",
    },
    select: {
        position: "relative",
        zIndex: 0,
        width: "130px",
        fontSize: "1.4rem",
    },
    month: {
        width: "110px",
        marginRight: "14px",
    },
    year: {
        width: "70px",
    },
    dropdownIcon: {
        bottom: "5px",
    },
    periodSwitcher: {
        flex: "2 0",
        display: "flex",
        justifyContent: "flex-end",
        padding: "0 14px",
    },
};

const Header = ({period, month, year, day, onChange, onMonthChange, onYearChange, onPeriodChange}) => {
    const _move = (forward) => {
        const date = moment([year, month, day]);
        switch (period) {
            case "week":
                date[forward ? "add" : "subtract"](7, "days");
                break;
            case "month":
                date[forward ? "add" : "subtract"](1, "months");
                break;
        }
        onChange(date);
    };

    const back = () => {
        _move();
    };

    const forward = () => {
        _move(true);
    };

    const switchPeriod = (e) => {
        onPeriodChange(e.currentTarget.dataset.period);
    };
    const date = moment([year, month, day]);
    if (period === "week") {
        date.isoWeekday(1);
    }
    return (
        <div style={s.wrapper}>
            <button type="button" onClick={back} className="btn-icon">
                <i className="material-icons arrow">arrow_back</i>
            </button>
            <button type="button" onClick={forward} className="btn-icon">
                <i className="material-icons arrow">arrow_forward</i>
            </button>
            {period === "week" &&
                <div style={s.days}>
                    {date.date()} - {moment(date).isoWeekday(7).date()}
                </div>
            }
            <div style={stilist(s, "select", "month")}>
                <select name="month"
                    value={month}
                    onChange={onMonthChange}
                    className="form-control"
                    >
                    {getMonthOptions()}
                </select>
                <i className="material-icons arrow" style={s.dropdownIcon}>arrow_drop_down</i>
            </div>
            <div style={stilist(s, "select", "year")}>
                <select name="year"
                    value={year}
                    onChange={onYearChange}
                    className="form-control"
                    >
                    {getYearOptions(year)}
                </select>
                <i className="material-icons arrow" style={s.dropdownIcon}>arrow_drop_down</i>
            </div>
            <div style={s.periodSwitcher}>
                <button
                    type="button"
                    onClick={switchPeriod}
                    className={cx("btn-flat", { "btn-default": period === "week" })}
                    data-period="week"
                    >
                    Неделя
                </button>
                <button
                    type="button"
                    onClick={switchPeriod}
                    className={cx("btn-flat", { "btn-default": period === "month" })}
                    data-period="month"
                    >
                    Месяц
                </button>
            </div>
        </div>
    );
};

export default Header;