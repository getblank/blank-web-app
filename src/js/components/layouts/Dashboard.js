import React, { Component } from "react";
import Widget from "../forms/viewers/Widget";
import DateRange from "../forms/inputs/date/DateRange";

const defaultDateRange = [
    //86400000
    new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString(),
    new Date(new Date().setUTCHours(23, 59, 59, 999)).toISOString(),
];

class Dashboard extends Component {
    constructor(props) {
        super(props);
        const paramsStr = sessionStorage.getItem(props.storeName + "-dashboard-params");
        let params = {
            dateRange: defaultDateRange,
        };

        if (paramsStr) {
            try {
                params = JSON.parse(paramsStr);
            } catch (e) {
                console.error("cannot load dashboard params from sessionStorage");
            }
        }
        this.state = {
            params: params,
        };
        this.dateRangeChangedHandler = this.dateRangeChangedHandler.bind(this);
    }

    dateRangeChangedHandler(value) {
        value = value || defaultDateRange;
        this.setState({ params: { dateRange: value } });
    }

    render() {
        const widgetsDescs = this.props.storeDesc.widgets;
        const widgets = widgetsDescs.map(wd => {
            if (Array.isArray(this.props.use) && this.props.use.indexOf(wd._id) < 0) {
                return null;
            }
            return <Widget storeName={this.props.storeName}
                params={this.state.params}
                key={"widget-" + wd._id}
                widgetId={wd._id}
                widgetDesc={wd} />;
        }).filter(w => w != null);
        return (
            <div className="fill relative flex column layout-dashboard">
                <div className="scroll fill">
                    <div className="dashboard-wrapper">
                        <div style={{ width: "300px" }}>
                            <DateRange
                                value={this.state.params.dateRange}
                                onChange={this.dateRangeChangedHandler}
                                utc={true}
                                shouldComponentUpdate={() => false}
                                required={true} />
                        </div>
                        {widgets}
                    </div>
                </div>
            </div>
        );
    }
}

export default Dashboard;