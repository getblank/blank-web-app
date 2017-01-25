import React, { Component } from "react";
import moment from "moment";
import Header from "./calendar/Header";
import Month from "./calendar/Month";
import Week from "./calendar/Week";
import filtersActions from "../../actions/filtersActuators";
import filtersStore from "../../stores/filtersStore";
import preferencesActions from "../../actions/preferencesActuators";
import preferencesStore from "../../stores/preferencesStore";

const colorProp = "color";

const s = {
    wrapper: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
    },
    period: {
        flex: "2 0",
        display: "flex",
        overflow: "auto",
        opacity: 0,
    },
    showPeriod: {
        opacity: 1,
        marginLeft: 0,
        marginRight: 0,
        transform: "translateX(0)",
        transition: "all .2s linear",
    },
};

class Calendar extends Component {
    constructor(props) {
        super(props);
        this.moment = moment; //moment.utc();
        this.dateProp = "startTime";
        this.endDateProp = "endTime";
        const currentFilter = (filtersStore.getFilters(props.storeName)[this.dateProp] || {}).$ne;
        let d = currentFilter ? this.moment(currentFilter.slice(1)) : this.moment();
        if (!d.isValid()) {
            d = this.moment();
        }
        this.state = {
            year: d.year(),
            month: d.month(),
            day: d.date(),
            period: preferencesStore.getUserPreference(props.storeName + "-calendar-period") || "month",
            isInc: true,
        };
        this.getEvents = this.getEvents.bind(this);
        this.handleDateChange = this.handleDateChange.bind(this);
        this.handleMonthChange = this.handleMonthChange.bind(this);
        this.handleYearChange = this.handleYearChange.bind(this);
        this.handlePeriodChange = this.handlePeriodChange.bind(this);
    }

    componentDidMount() {
        const currentFilter = (filtersStore.getFilters(this.props.storeName)[this.dateProp] || {}).$ne;
        if (!currentFilter) {
            setTimeout(() => {
                console.log("Setting initial filter for calendar in store ", this.props.storeName);
                this._setFilter();
            });
        }
    }

    componentDidUpdate(prevProps, prevState) {
        const needSetFilter = prevState.year !== this.state.year ||
            prevState.month !== this.state.month ||
            prevState.day !== this.state.day;
        if (needSetFilter) {
            const noReloadItems = prevState.year === this.state.year && prevState.month === this.state.month;
            this._setFilter(noReloadItems);
        }
    }

    handlePeriodChange(value) {
        preferencesActions.setPreference(this.props.storeName + "-calendar-period", value);
        this.setState({ period: value });
    }

    handleDateChange(value) {
        const d = this.moment(value);
        const isInc = d > moment([this.state.year, this.state.month, this.state.day]);
        // const y = this.state.year, m = this.state.month;
        this.setState({ year: d.year(), month: d.month(), day: d.date(), isInc }, () => {
            // this._setFilter(y === this.state.year && m === this.state.month);
        });
    }

    handleMonthChange(e) {
        this._handleChange("month", e.target.value);
    }

    handleYearChange(e) {
        this._handleChange("year", e.target.value);
    }

    _handleChange(part, value) {
        let d = this.moment([this.state.year, this.state.month, this.state.day]);
        d[part](value);
        const isInc = d > moment([this.state.year, this.state.month, this.state.day]);
        this.setState({ year: d.year(), month: d.month(), day: d.date(), isInc }, () => {
            // this._setFilter();
        });
    }

    _setFilter(noReloadItems) {
        const d = this.moment([this.state.year, this.state.month, this.state.day]);
        const range = this.moment([this.state.year, this.state.month]);
        filtersActions.setFilter(this.props.storeName, this.dateProp, {
            $gte: range.toISOString(),
            $lte: range.add(1, "month").toISOString(),
            $ne: "$" + d.toISOString(),
        }, true, noReloadItems);
    }

    getEvents(date, hour) {
        const dateProp = this.dateProp;
        const comparator = (a, b) => {
            if (a[dateProp] > b[dateProp]) { return 1 }
            if (a[dateProp] < b[dateProp]) { return -1 }
            return 0;
        };
        date = this.moment(date); //.utc();
        if (hour != null) {
            date.hour(hour);
        }
        const min = date.toISOString();
        const max = date.add(hour != null ? 1 : 24, "hours").toISOString();
        return (this.props.items || [])
            .filter(i => {
                const itemDate = i[this.dateProp];
                return itemDate >= min && itemDate < max;
            })
            .sort(comparator);
    }

    render() {
        const {period} = this.state;
        const slideStyle = {};
        slideStyle["transform"] = `translateX(${this.state.isInc ? "" : "-"}48px)`;
        return (
            <div style={s.wrapper}>
                <Header
                    {...this.state}
                    onPeriodChange={this.handlePeriodChange}
                    onChange={this.handleDateChange}
                    onMonthChange={this.handleMonthChange}
                    onYearChange={this.handleYearChange}
                    />
                <div style={Object.assign({}, s.period, slideStyle, this.props.ready ? s.showPeriod : null)}>
                    {period === "month" &&
                        <Month
                            {...this.state}
                            moment={this.moment}
                            getEvents={this.getEvents}
                            onDateChange={this.handleDateChange}
                            create={this.props.create}
                            select={this.props.select}
                            dateProp={this.dateProp}
                            endDateProp={this.endDateProp}
                            colorProp={colorProp}
                            />
                    }
                    {period === "week" &&
                        <Week
                            {...this.state}
                            moment={this.moment}
                            getEvents={this.getEvents}
                            onDateChange={this.handleDateChange}
                            create={this.props.create}
                            select={this.props.select}
                            dateProp={this.dateProp}
                            endDateProp={this.endDateProp}
                            colorProp={colorProp}
                            />
                    }
                </div>
            </div>
        );
    }
}

export default Calendar;