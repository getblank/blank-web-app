import React, { Component } from "react";
import moment from "moment";
import Header from "./calendar/Header";
import Month from "./calendar/Month";
import filtersActions from "../../actions/filtersActuators";
import filtersStore from "../../stores/filtersStore";

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
        this.dateProp = "dateTime";
        const currentFilter = (filtersStore.getFilters(props.storeName)[this.dateProp] || {}).$ne;
        let d = currentFilter ? this.moment(currentFilter.slice(1)) : this.moment();
        if (!d.isValid()) {
            d = this.moment();
        }
        this.state = Object.assign({ year: d.year(), month: d.month(), day: d.date(), isInc: true });
        this.getEvents = this.getEvents.bind(this);
        this.handleDateChange = this.handleDateChange.bind(this);
        this.handleMonthChange = this.handleMonthChange.bind(this);
        this.handleYearChange = this.handleYearChange.bind(this);
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

    getEvents(date) {
        date = this.moment(date).utc();
        const min = date.toISOString();
        const max = date.add(24, "hours").toISOString();
        return (this.props.items || [])
            .filter(i => {
                const itemDate = i[this.dateProp];
                return itemDate >= min && itemDate < max;
            });
    }

    render() {
        const slideStyle = {};
        slideStyle["transform"] = `translateX(${this.state.isInc ? "" : "-"}48px)`;
        return (
            <div style={s.wrapper}>
                <Header
                    {...this.state}
                    onMonthChange={this.handleMonthChange}
                    onYearChange={this.handleYearChange}
                    />
                <div style={Object.assign({}, s.period, slideStyle, this.props.ready ? s.showPeriod : null)}>
                    <Month
                        {...this.state}
                        moment={this.moment}
                        getEvents={this.getEvents}
                        onDateChange={this.handleDateChange}
                        create={this.props.create}
                        select={this.props.select}
                        dateProp={this.dateProp}
                        />
                </div>
            </div>
        );
    }
}

export default Calendar;