import React, {Component} from "react";
import Widget from "../forms/viewers/Widget";

class Dashboard extends Component {
    render() {
        let widgetsDescs = this.props.storeDesc.widgets;
        let widgets = widgetsDescs.map(wd => {
            return <Widget storeName={this.props.storeName}
                key={"widget-" + wd._id}
                widgetId={wd._id}
                widgetDesc={wd}/>;
        });
        return (
            <div>
                {widgets}
            </div>
        );
    }
}

export default Dashboard;