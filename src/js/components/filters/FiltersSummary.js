/**
 * Created by kib357 on 06/09/15.
 */

import React from "react";
import { displayTypes } from "constants";
import ValueConverter from "./ValueConverter";
import i18n from "../../stores/i18nStore";
import filtersActions from "../../actions/filtersActuators";
import moment from "moment";
import classNames from "classnames";

class FiltersSummary extends React.Component {
    clear(e) {
        e.preventDefault();
        filtersActions.clearFilter(this.props.storeName);
        if (typeof this.props.onClear === "function") {
            this.props.onClear();
        }
    }

    render() {
        // if (prefsStore.getUserPreference(this.props.storeName + '-show-filters')) {
        //     return null;
        // }
        let filters = Object.keys(this.props.filters).sort().map((filterName) => {
            let filter = this.props.filters[filterName];
            let desc = this.props.filtersDesc[filterName];
            if (desc == null || filterName === "_state") {
                return null;
                //     if (prefsStore.getUserPreference(this.props.storeName + '-show-filters')) {
                //         return null;
                //     }
                //     let config = configStore.getConfig(this.props.storeName);
                //     let label = template.render((config.states[filter] || {}).label || '', {"$i18n": i18n.getForStore(this.props.storeName)});
                //     return (<span className="m-r-14" key={filterName}>{label}</span>);
            }
            let templateModel = { "$i18n": i18n.getForStore(this.props.storeName) };
            let label = desc.label(templateModel);
            label = (label && label !== filterName) ? (label + ":") : "";
            let getValueLabel = (val) => {
                for (let i in desc.options) {
                    let matched;
                    if (typeof desc.options[i].value === "number") {
                        matched = desc.options[i].value === val * 1;
                    } else {
                        matched = desc.options[i].value === val * "";
                    }
                    if (matched) {
                        return desc.options[i].label(templateModel);
                    }
                }
            };

            switch (desc.display) {
                case displayTypes.searchBox:
                    return (<span key={filterName}>
                        {label} <ValueConverter key={filterName} value={filter} storeName={desc.store}/>
                    </span>);
                case displayTypes.dateRange:
                    return (<span key={filterName}>
                        {label} {moment(filter[0]).format("L") + " - " + moment(filter[1]).format("L") }
                    </span>);
                case displayTypes.numberRange:
                    return (<span key={filterName}>
                        {label} {(filter[0] || "...") + " - " + (filter[1] || "...") }
                    </span>);
                case displayTypes.checkList: {
                    return (<span key={filterName}>
                        {label} {(filter || []).map(val => getValueLabel(val)).join(", ") }
                    </span>);
                }
                case displayTypes.select:
                    return (<span key={filterName}>
                        {label} {getValueLabel(filter) }
                    </span>);
                default:
                    return (<span className="m-r-14" key={filterName}>{label} {filter}</span>);
            }
        });
        filters = filters.filter(f => f != null);
        let show = filters.length > 0;
        let cn = classNames("pd-filters-summary relative no-shrink", {
            "show": show,
        });
        return (
            <div className={cn}>
                <span>{i18n.get("filters.title") + ":"}</span>{filters}
                { show ?
                    <button onClick={this.clear.bind(this) }
                        className="btn-icon first last close">
                        <i className="material-icons text md-18">close</i>
                    </button> : null }
            </div>
        );
    }
}

FiltersSummary.propTypes = {};
FiltersSummary.defaultProps = {};

export default FiltersSummary;
