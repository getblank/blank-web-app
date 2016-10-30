import React from "react";
import moment from "moment";
import stilist from "stilist";

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
        padding: "7px 0",
        backgroundColor: "#fff",
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
};

const Header = ({month, year, onMonthChange, onYearChange}) => {
    const back = () => {
        onMonthChange({ target: { value: month - 1 } });
    };

    const forward = () => {
        onMonthChange({ target: { value: month + 1 } });
    };

    return (
        <div style={s.wrapper}>
            <button type="button" onClick={back} className="btn-icon">
                <i className="material-icons arrow">arrow_back</i>
            </button>
            <button type="button" onClick={forward} className="btn-icon">
                <i className="material-icons arrow">arrow_forward</i>
            </button>
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
        </div>
    );
};

export default Header;