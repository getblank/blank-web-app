import React, { Component } from "react";
import Widget from "../forms/viewers/Widget";
import filtersStore from "../../stores/filtersStore";
import { storeEvents } from "constants";

class Dashboard extends Component {
    constructor(props) {
        super(props);

        const filter = filtersStore.getFilters();
        this.state = { filter };

        this.filterChangeHandler = this.filterChangeHandler.bind(this);
        filtersStore.on(storeEvents.CHANGED, this.filterChangeHandler);
    }

    componentWillUnmount() {
        filtersStore.removeListener(storeEvents.CHANGED, this.filterChangeHandler);
    }

    filterChangeHandler() {
        const filter = filtersStore.getFilters();
        this.setState({ filter });
    }

    render() {
        const widgetsDescs = this.props.storeDesc.widgets;
        const widgets = widgetsDescs.filter(e => !e.hideInDashboard)
            .map(wd => {
                if (Array.isArray(this.props.use) && this.props.use.indexOf(wd._id) < 0) {
                    return null;
                }

                return <Widget storeName={this.props.storeName}
                    filter={this.state.filter}
                    key={"widget-" + wd._id}
                    widgetId={wd._id}
                    widgetDesc={wd} />;
            })
            .filter(w => w != null);

        return (
            <div className="fill relative flex column layout-dashboard">
                <div className="scroll fill">
                    <div className="dashboard-wrapper">
                        {widgets}
                    </div>
                </div>
            </div>
        );
    }
}

export default Dashboard;