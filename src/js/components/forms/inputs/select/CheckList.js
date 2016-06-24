
import React from "react";
import config from "../../../../stores/configStore.js";
import i18n from "../../../../stores/i18nStore.js";
import { storeEvents } from "constants";
import template from "template";

var CheckList = React.createClass({
    getStateFromStore: function () {
        return {
            "options": this.getOptions(),
        };
    },
    getOptions() {
        this.valueMap = {};
        return (this.props.store ? config.getMapStoreEntries(this.props.store) : this.props.options).map(o => {
            let val = o.value || o._id;
            this.valueMap[val + ""]  = val;
            return { "_id": val + "", "label": o.label };
        });
    },
    componentWillReceiveProps(nextProps) {
        if (this.props.store !== nextProps.store) {
            this.setState({ "selected": nextProps.value, "options": this.getOptions() });
        } else {
            this.setState({ "selected": nextProps.value });
        }
    },
    getInitialState: function () {
        var state = this.getStateFromStore();
        state.selected = this.props.value;
        return state;
    },
    toggleSelect: function (e) {
        let value = e.target.getAttribute("value"),
            selected = Array.isArray(this.state.selected) ? this.state.selected.slice() : [],
            ind = selected.indexOf(this.valueMap[value]);
        if (ind > -1) {
            selected.splice(ind, 1);
        } else {
            selected.push(this.valueMap[value]);
        }
        if (typeof this.props.onChange === "function") {
            this.props.onChange(selected);
        }
    },
    render: function () {
        var options = this.state.options.map(function (option) {
            let label = option.label;
            if (this.props.store) {
                label = template.render(option.label, { "$i18n": i18n.getForStore(this.props.storeName) });
            }
            let chkbxId = this.props.propName + "-" + option._id;
            return (
                <div div className={"check-list-item" + (this.props.disabled ? " disabled" : "") }
                    key={option._id}>
                    <input type="checkbox" id={chkbxId + "-check"}
                        disabled={this.props.disabled} onChange={this.toggleSelect}
                        onFocus={this.props.onFocus}
                        onBlur={this.props.onBlur}
                        value={option._id}
                        checked={Array.isArray(this.state.selected) && (this.state.selected.indexOf(this.valueMap[option._id]) > -1) }/>
                    <label htmlFor={chkbxId + "-check"}>{label}</label>
                </div>
            );
        }, this);
        return (
            <div className="check-list">
                {options}
            </div>
        );
    },
})
    ;

export default CheckList;
module.exports = CheckList;