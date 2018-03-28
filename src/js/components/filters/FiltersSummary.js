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
        const filters = Object.keys(this.props.filters)
            .sort((a, b) => {
                return this.props.filtersDesc[a].formOrder - this.props.filtersDesc[b].formOrder;
            })
            .map((filterName) => {
                const filter = this.props.filters[filterName];
                const desc = this.props.filtersDesc[filterName];
                if (desc == null || filterName === "_state") {
                    return null;
                }

                const templateModel = { $i18n: i18n.getForStore(this.props.storeName) };
                let label = desc.label(templateModel);
                label = (label && label !== filterName) ? (label + ":") : "";

                let getValueLabel = (val) => {
                    for (let i in desc.options) {
                        let matched;
                        if (typeof desc.options[i].value === "number") {
                            matched = desc.options[i].value === val * 1;
                        } else {
                            matched = desc.options[i].value === val + "";
                        }
                        if (matched) {
                            return desc.options[i].label(templateModel);
                        }
                    }
                };

                switch (desc.display) {
                    case displayTypes.searchBox:
                        return (<span key={filterName}>
                            {label} <ValueConverter key={filterName} value={filter} storeName={desc.store} />
                        </span>);
                    case displayTypes.dateRange: {
                        const [from, to] = filter;
                        const [fromDate, toDate] = [moment.utc(from), moment.utc(to)];
                        if (toDate - fromDate < 86400000) {
                            return (<span key={filterName}>
                                {label} {fromDate.format("L")}
                            </span>);
                        }

                        return (<span key={filterName}>
                            {label} {fromDate.format("L") + " - " + toDate.format("L")}
                        </span>);
                    }
                    case displayTypes.numberRange:
                    case displayTypes.stringRange: {
                        const [from, to] = filter;
                        return (<span key={filterName}>
                            {label} {(from || "...") + " - " + (to || "...")}
                        </span>);
                    }
                    case displayTypes.checkbox:
                        return <span key={filterName}>{desc.label(templateModel)}</span>;
                    case displayTypes.checkList: {
                        return (<span key={filterName}>
                            {label} {(filter || []).map(val => getValueLabel(val)).join(", ")}
                        </span>);
                    }
                    case displayTypes.radio:
                    case displayTypes.select:
                        return (<span key={filterName}>
                            {label} {getValueLabel(filter)}
                        </span>);
                    default:
                        return (<span className="m-r-14" key={filterName}>{label} {filter}</span>);
                }
            })
            .filter(f => f != null);

        const show = filters.length > 0;
        const cn = classNames("pd-filters-summary relative no-shrink", {
            show,
        });

        return (
            <div className={cn}>
                <span>{i18n.get("filters.title") + ":"}</span>{filters}
                {show ?
                    <button onClick={this.clear.bind(this)}
                        className="btn-icon first last close">
                        <i className="material-icons text md-18">close</i>
                    </button> : null}
            </div>
        );
    }
}

FiltersSummary.propTypes = {};
FiltersSummary.defaultProps = {};

export default FiltersSummary;
