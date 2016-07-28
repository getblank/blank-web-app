/**
 * Created by kib357 on 05/03/16.
 */

import React from "react";
import Widget from "./Widget";
import SimpleInput from "../../forms/inputs/SimpleInput";
import credentialsStore from "../../../stores/credentialsStore";

const defaultDateRange = [
    //86400000
    new Date(new Date(Date.now() - 86400000 * 6).setUTCHours(0, 0, 0, 0)),
    new Date(new Date().setUTCHours(23, 59, 59, 999)),
];

class WidgetProperty extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            "params": {},
        };
        if (props.field.props && props.field.props.dateRange) {
            this.state.params.dateRange = defaultDateRange;
        }
        this.handleParamsChange = this.handleParamsChange.bind(this);
    }

    handleParamsChange(prop, value) {
        let p = JSON.parse(JSON.stringify(this.state.params));
        p[prop] = value;
        this.setState({"params": p});
    }

    render() {
        let propDesc = this.props.field, user = credentialsStore.getUser();
        let wIds = propDesc.widgets;
        if (!Array.isArray(wIds)) {
            wIds = [wIds];
        }
        let widgets = wIds.map(wId => {
            let widgetDesc = (this.props.storeDesc.widgets || []).find(w => w._id === wId);
            if (widgetDesc != null) {
                return <Widget storeName={this.props.storeName}
                    key={wId}
                    params={this.state.params}
                    itemId={(this.props.item || {})._id}
                    widgetId={wId}
                    widgetDesc={widgetDesc}/>;
            } else {
                return <p key={wId}>{`Widget desc for id '${wId}' not found!`}</p>;
            }
        });
        let props = Object.keys(propDesc.props || {}).map((propName, index) => {
            let prop = propDesc.props[propName];
            if (prop.hidden(user, this.state.params) || prop.display === "none" || prop.name.indexOf("_") === 0) {
                return null;
            }
            return <SimpleInput fieldName={propName}
                             key={propName + "-" + index}
                             field={prop}
                             storeName={this.props.storeName}
                             item={this.state.params}
                             onChange={this.handleParamsChange.bind(this)}
                             value={this.state.params[propName]}/>;
        });
        return <div className="dashboard">
            <div className="params">
                {props}
            </div>
            <div className="widgets">
                {widgets}
            </div>
        </div>;
    }
}

WidgetProperty.propTypes = {};
WidgetProperty.defaultProps = {};

export default WidgetProperty;
