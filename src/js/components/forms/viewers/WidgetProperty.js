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
            params: {},
        };
        if (props.field.props && props.field.props.dateRange) {
            this.state.params.dateRange = defaultDateRange;
        }

        this.handleParamsChange = this.handleParamsChange.bind(this);
    }

    handleParamsChange(prop, value) {
        const p = JSON.parse(JSON.stringify(this.state.params));
        p[prop] = value;
        this.setState({ params: p });
    }

    render() {
        const propDesc = this.props.field, user = credentialsStore.getUser();
        let wIds = propDesc.widgets;
        if (!Array.isArray(wIds)) {
            wIds = [wIds];
        }

        const widgets = wIds.map(wId => {
            const widgetDesc = (this.props.storeDesc.widgets || []).find(w => w._id === wId);
            if (widgetDesc != null) {
                return <Widget storeName={this.props.storeName}
                    key={wId}
                    params={this.state.params}
                    itemId={(this.props.item || {})._id}
                    item={this.props.item}
                    widgetId={wId}
                    widgetDesc={widgetDesc} />;
            } else {
                return <p key={wId}>{`Widget desc for id '${wId}' not found!`}</p>;
            }
        });

        const props = Object.keys(propDesc.props || {}).map((propName, index) => {
            const prop = propDesc.props[propName];
            if (prop.hidden(user, this.state.params) || prop.display === "none" || prop.name.indexOf("_") === 0) {
                return null;
            }

            return <SimpleInput fieldName={propName}
                key={propName + "-" + index}
                field={prop}
                storeName={this.props.storeName}
                item={this.state.params}
                shouldComponentUpdate={() => false}
                onChange={this.handleParamsChange.bind(this)}
                value={this.state.params[propName]} />;
        });

        return <div className="dashboard" style={propDesc.style}>
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
