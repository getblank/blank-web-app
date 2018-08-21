/**
 * Created by kib357 on 05/03/16.
 */

import React from "react";
import classNames from "classnames";
import Widget from "./Widget";
import SimpleInput from "../../forms/inputs/SimpleInput";
import SimpleLabel from "../SimpleLabel";
import credentialsStore from "../../../stores/credentialsStore";
import i18n from "../../../stores/i18nStore.js";

const defaultDateRange = [
    //86400000
    new Date(new Date(Date.now() - 86400000 * 6).setUTCHours(0, 0, 0, 0)),
    new Date(new Date().setUTCHours(23, 59, 59, 999)),
];

const columnWidth = 330;

class WidgetProperty extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            params: {},
            columnCount: 1,
        };
        if (props.field.props && props.field.props.dateRange) {
            this.state.params.dateRange = defaultDateRange;
        }

        this.handleParamsChange = this.handleParamsChange.bind(this);
    }

    componentDidRender() {
        //Checking form column count
        const form = this.paramForm;
        if (form == null) {
            return;
        }

        const columnCount = Math.floor(form.offsetWidth / columnWidth);
        if (columnCount !== this.state.columnCount) {
            this.setState({ columnCount });
        }
    }

    handleParamsChange(prop, value) {
        const params = JSON.parse(JSON.stringify(this.state.params));
        params[prop] = value;
        this.setState({ params });
    }

    render() {
        const propDesc = this.props.field;
        const user = credentialsStore.getUser();
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
                    widgetDesc={widgetDesc}
                    storeDesc={this.props.storeDesc}
                    performAction={this.props.performAction}
                />;
            } else {
                return <p key={wId}>{`Widget desc for id '${wId}' not found!`}</p>;
            }
        });

        const props = Object.keys(propDesc.props || {})
            .sort((a, b) => {
                if (propDesc.props[a].formOrder === propDesc.props[b].formOrder) {
                    return 0;
                }

                if (propDesc.props[a].formOrder > propDesc.props[b].formOrder) {
                    return 1;
                }

                return -1;
            })
            .map((propName, index) => {
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

        const labelText = propDesc.label({
            $i18n: i18n.getForStore(this.props.storeName),
            $item: this.props.item,
            $user: this.props.user,
        });

        const label = !this.props.hideLabel && (
            <SimpleLabel name={propDesc.name}
                text={labelText !== propDesc.name ? labelText : ""}
                changed={this.state.changed}
                tooltip={propDesc.tooltip}
                storeName={this.props.storeName}
                className={propDesc.labelClassName} />
        );

        const cn = classNames(this.props.className, {
            "editor-form": true,
            "dark": this.props.dark,
            "multi-column": this.state.columnCount > 1,
        });

        return <div className="dashboard" style={propDesc.style}>
            {label}
            <div className="params">
                <div ref={e => this.paramForm = e} id={this.props.id} className={cn}>
                    <div className={"fields-wrapper"}>
                        {props}
                    </div>
                </div>
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
