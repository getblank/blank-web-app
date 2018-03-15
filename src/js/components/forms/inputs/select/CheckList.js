
import React from "react";
import createReactClass from "create-react-class";
import config from "../../../../stores/configStore.js";
import i18n from "../../../../stores/i18nStore.js";
import Tooltip from "../../../misc/Tooltip";
import template from "template";

const CheckList = createReactClass({
    getStateFromStore() {
        return {
            options: this.getOptions(),
        };
    },

    getOptions() {
        this.valueMap = {};
        return (this.props.store ? config.getMapStoreEntries(this.props.store) : this.props.options).map(o => {
            const val = o.value != null ? o.value : o._id;
            this.valueMap[val + ""] = val;
            const { label, tooltip } = o;
            // return { _id: val + "", label: o.label };
            return { _id: val + "", label, tooltip };
        });
    },

    componentWillReceiveProps(nextProps) {
        if (this.props.store !== nextProps.store) {
            this.setState({ selected: nextProps.value, options: this.getOptions() });
        } else {
            this.setState({ selected: nextProps.value });
        }
    },

    getInitialState() {
        const state = this.getStateFromStore();
        state.selected = this.props.value;
        return state;
    },

    toggleSelect(e) {
        const value = e.target.getAttribute("value");
        const selected = Array.isArray(this.state.selected) ? this.state.selected.slice() : [];
        const ind = selected.indexOf(this.valueMap[value]);
        if (ind > -1) {
            selected.splice(ind, 1);
        } else {
            selected.push(this.valueMap[value]);
        }

        if (typeof this.props.onChange === "function") {
            this.props.onChange(selected);
        }
    },

    render() {
        const options = this.state.options.map(option => {
            let label = option.label;
            let tooltip = option.tooltip || "";
            if (this.props.store) {
                label = template.render(option.label, { $i18n: i18n.getForStore(this.props.storeName) });
                tooltip = template.render(tooltip, { $i18n: i18n.getForStore(this.props.storeName) });
            }

            const chkbxId = this.props.propName + "-" + option._id;
            const elementId = `${chkbxId}-check`;
            return (
                <div className={"check-list-item" + (this.props.disabled ? " disabled" : "")}
                    key={option._id}>
                    <input type="checkbox" id={elementId}
                        disabled={this.props.disabled} onChange={this.toggleSelect}
                        onFocus={this.props.onFocus}
                        onBlur={this.props.onBlur}
                        value={option._id}
                        checked={Array.isArray(this.state.selected) && (this.state.selected.indexOf(this.valueMap[option._id]) > -1)} />
                    <label htmlFor={elementId}>{label}</label>
                    {tooltip && <Tooltip content={() => tooltip} storeName={this.props.storeName} />}
                </div>
            );
        });

        return (
            <div className="check-list">
                {options}
            </div>
        );
    },
});

export default CheckList;
module.exports = CheckList;