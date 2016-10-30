import React, { Component } from "react";
import moment from "moment";
import Header from "./calendar/Header";
import Month from "./calendar/Month";

class Calendar extends Component {
    constructor(props) {
        super(props);
        this.moment = moment.utc; //moment;
        const now = this.moment();
        console.log("________________", now.date());
        this.state = Object.assign({ year: now.year(), month: now.month(), day: now.date() });
        this.handleDateChange = this.handleDateChange.bind(this);
        this.handleMonthChange = this.handleMonthChange.bind(this);
        this.handleYearChange = this.handleYearChange.bind(this);
    }

    handleDateChange(value) {
        const d = moment(value);
        this.setState({ year: d.year(), month: d.month(), day: d.date() });
    }

    handleMonthChange(e) {
        this._handleChange("month", e.target.value);
    }

    handleYearChange(e) {
        this._handleChange("year", e.target.value);
    }

    _handleChange(part, value) {
        const d = moment([this.state.year, this.state.month, this.state.day]);
        d[part](value);
        this.setState({ year: d.year(), month: d.month(), day: d.date() });
    }

    render() {
        return (
            <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                <Header
                    {...this.state}
                    onMonthChange={this.handleMonthChange}
                    onYearChange={this.handleYearChange}
                    />
                <div style={{ flex: "2 0", display: "flex", overflow: "auto" }}>
                    <Month
                        {...this.state}
                        onDateChange={this.handleDateChange}
                        />
                </div>
            </div>
        );
    }
}

export default Calendar;