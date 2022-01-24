import React from "react";
import moment from "moment";
import Header from "./calendar/Header";
import Month from "./calendar/Month";
import Week from "./calendar/Week";
import filtersActions from "actions/filtersActuators";
import filtersStore from "stores/filtersStore";
import preferencesActions from "actions/preferencesActuators";
import preferencesStore from "stores/preferencesStore";
import { useCurrentStore } from "hooks/useCurrentStore";
import Loader from "components/misc/Loader";

const s = {
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

const Calendar = ({ items, ready, create, select }) => {
    const { storeName, storeDesc } = useCurrentStore();
    const { dateProp } = storeDesc;

    // const period = preferencesStore.getUserPreference(storeName + "-calendar-period") || "month";
    const currentFilter = (filtersStore.getFilters(storeName)[dateProp] || {}).$ne;
    let d = currentFilter ? moment(currentFilter.slice(1)) : moment();
    if (!d.isValid()) {
        d = moment();
    }

    const [day, setDay] = React.useState({ year: d.year(), month: d.month(), day: d.date() });

    React.useEffect(() => {
        if (!currentFilter) {
            setTimeout(() => {
                console.log("Setting initial filter for calendar in store ", storeName);
                setFilter();
            });
        }
    }, []);

    // const handlePeriodChange = (value) => {
    //     preferencesActions.setPreference(storeName + "-calendar-period", value);
    // };

    const handleDateChange = (value) => {
        const d = moment(value);

        const newDay = { year: d.year(), month: d.month(), day: d.date() };
        setDay({ ...newDay });

        const needSetFilter = day.year !== newDay.year || day.month !== newDay.month || day.day !== newDay.day;
        if (needSetFilter) {
            const noReloadItems = day.year === newDay.year && day.month === newDay.month;
            setFilter(noReloadItems, newDay);
        }
    };

    const handleChange = (part, value) => {
        const d = moment([day.year, day.month, day.day]);
        d[part](value);
        handleDateChange(d);
    };

    const handleMonthChange = (e) => {
        handleChange("month", e.target.value);
    };

    const handleYearChange = (e) => {
        handleChange("year", e.target.value);
    };

    const setFilter = (noReloadItems, newDay) => {
        const date = newDay || day;
        const range = moment([date.year, date.month]);
        filtersActions.setFilter(
            storeName,
            dateProp,
            [range.toISOString(), range.add(1, "month").toISOString()],
            true,
            noReloadItems,
        );
    };

    const getEvents = (date, hour) => {
        const { headerProperty = "name" } = storeDesc;
        const comparator = (a, b) => {
            if (a[dateProp] > b[dateProp]) {
                return 1;
            }
            if (a[dateProp] < b[dateProp]) {
                return -1;
            }
            return 0;
        };
        date = moment(date);
        if (hour != null) {
            date.hour(hour);
        }
        const min = date.toISOString();
        const max = date.add(hour != null ? 1 : 24, "hours").toISOString();
        return (items || [])
            .filter((i) => {
                const itemDate = i[dateProp];
                return itemDate >= min && itemDate < max;
            })
            .map((e) => ({
                ...e,
                name: e[headerProperty],
            }))
            .sort(comparator);
    };

    return (
        <div className="d-flex flex-column width100">
            <Header
                {...day}
                // period={period}
                period="month"
                // onPeriodChange={handlePeriodChange}
                onChange={handleDateChange}
                onMonthChange={handleMonthChange}
                onYearChange={handleYearChange}
            />
            {!ready && <Loader />}
            <div style={Object.assign({}, s.period, ready ? s.showPeriod : null)}>
                {/* {period === "month" && ( */}
                <Month
                    {...day}
                    ready={ready}
                    moment={moment}
                    getEvents={getEvents}
                    onDateChange={handleDateChange}
                    create={create}
                    select={select}
                />
                {/* )} */}
                {/* {period === "week" && (
                    <Week
                        {...day}
                        moment={moment}
                        getEvents={getEvents}
                        onDateChange={handleDateChange}
                        create={create}
                        select={select}
                    />
                )} */}
            </div>
        </div>
    );
};

export default Calendar;
