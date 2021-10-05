/**
 * Created by kib357 on 02/09/15.
 */

import React from "react";
import AudioControls from "../forms/viewers/audio/AudioControls";
import Icon from "../misc/Icon";
import itemsActions from "../../actions/itemsActuators";
import historyActions from "../../actions/historyActuators";
import changesProcessor from "../../utils/changesProcessor";
import credentialsStore from "../../stores/credentialsStore";
import Html from "../forms/viewers/Html";
import config from "../../stores/configStore";
import i18n from "../../stores/i18nStore";
import cn from "classnames";
import { propertyTypes, displayTypes } from "constants";
import find from "utils/find";
import moment from "moment";
import SearchBox from "../forms/inputs/select/SearchBox";

class ColumnsSelector extends React.Component {
    constructor(props) {
        super(props);
        this.state = { opened: false };
        this.toggle = this.toggle.bind(this);
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
    }

    componentWillUnmount() {
        document.removeEventListener("click", this.handleDocumentClick);
    }

    toggle(e) {
        if (e) {
            e.preventDefault();
        }

        this.setState({ opened: !this.state.opened }, function () {
            this.manageListeners();
        });
    }

    handleDocumentClick(e) {
        const ref = this.refs["columnSelector"];
        if (ref == null) {
            this.toggle();
            return;
        }

        const refel = ReactDOM.findDOMNode(ref);
        if (e.target === refel || refel.contains(e.target)) {
            return;
        }

        this.toggle();
    }

    manageListeners() {
        if (this.state.opened) {
            document.addEventListener("click", this.handleDocumentClick);
        } else {
            document.removeEventListener("click", this.handleDocumentClick);
        }
    }

    render() {
        const style = { display: this.state.opened ? "inline-block" : "none" };
        const columns = this.props.columns.map((column, index) => {
            const className = cn({
                number: column.type === propertyTypes.int || column.type === propertyTypes.float,
                order: this.state.orderBy === column.prop,
                desc: this.state.orderBy === column.prop && this.state.orderDesc,
                sortable: !column.disableOrder,
            });

            return (
                <div
                    className={className}
                    key={column.prop + "-" + index}
                    onClick={this.props.toggleColumn.bind(this, column.prop)}
                >
                    <button type="button" className="btn-flat btn-fw">
                        <i
                            className={
                                this.props.excludedColumns.includes(column.prop)
                                    ? "fa fa-square-o m-r-8"
                                    : "fa fa-check-square m-r-8"
                            }
                        />
                        {column.label()}
                    </button>
                </div>
            );
        });

        return (
            <div style={{ display: "inline-block" }} className={this.state.relative ? "relative" : ""}>
                <button
                    type="submit"
                    tabIndex="-1"
                    className="btn-icon"
                    style={{ position: "absolute", right: "-50px", top: "25px" }}
                    onClick={this.toggle}
                >
                    <i className="material-icons text">arrow_drop_down</i>
                </button>

                <div className="pd-dropdown-menu left-side" ref="columnSelector" style={style}>
                    {columns}
                </div>
            </div>
        );
    }
}

class DataTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.state.page = 0;
        this.state.itemsOnPage = props.itemsOnPage ? props.itemsOnPage * 1 : 10;
        this.state.orderBy = "";
        this.state.orderDesc = false;
        this.state.columns = props.storeDesc.tableColumns || [];
        this.state.items = [];
        this.state.length = 0;
        this.state.loading = true;
        this.state.excludedColumns = this.getExcludedColumns().filter((e) => {
            for (let column of this.state.columns) {
                if (column.prop === e) {
                    return true;
                }
            }

            return false;
        });
        if (props.order) {
            this.state.orderDesc = props.order.indexOf("-") === 0;
            this.state.orderBy = props.order.replace("-", "");
        }

        this.passVisibleColumns();
        this.toggleSelect = this.toggleSelect.bind(this);
        this.toggleSelectAll = this.toggleSelectAll.bind(this);
        this.toggleColumn = this.toggleColumn.bind(this);
    }

    componentDidMount() {
        this.getData(this.state.page, this.state.itemsOnPage, this.state.orderBy, this.state.orderDesc);
    }

    componentWillUnmount() {
        this.unmounted = true;
    }

    componentWillReceiveProps(nextProps) {
        if (
            JSON.stringify(nextProps) !== JSON.stringify(this.props) ||
            (nextProps.items && JSON.stringify(nextProps.items) !== JSON.stringify(this.state.items))
        ) {
            this.getData(this.state.page, this.state.itemsOnPage, this.state.orderBy, this.state.orderDesc, nextProps);
        }
    }

    updateData() {
        this.getData(this.state.page, this.state.itemsOnPage, this.state.orderBy, this.state.orderDesc);
    }

    handleOrder(column) {
        const direction = this.state.orderBy === column ? !this.state.orderDesc : false;
        this.getData(this.state.page, this.state.itemsOnPage, column, direction);
    }

    handlePagination(plus) {
        let { page } = this.state;
        page += plus ? 1 : -1;
        const length = this.props.items ? this.props.items.length : this.state.length;
        if (page >= 0 && page <= length / this.state.itemsOnPage) {
            this.getData(page, this.state.itemsOnPage, this.state.orderBy, this.state.orderDesc);
        }
    }

    handleItemsOnPageChange(e) {
        const value = e.target.value;
        this.getData(0, parseInt(value, 10), this.state.orderBy, this.state.orderDesc);
    }

    getData(page, itemsOnPage, orderBy, orderDesc, nextProps) {
        const props = nextProps || this.props;
        const newState = {
            loading: false,
            page: page,
            itemsOnPage: itemsOnPage,
            orderBy: orderBy,
            orderDesc: orderDesc,
        };

        const skip = page * itemsOnPage;
        if (props.items) {
            const max = Math.min(skip + itemsOnPage, props.items.length);
            const items = props.items.slice();
            newState.items = items.slice(skip, max);
            this.setState(newState, () => {
                if (typeof this.props.onNavigation === "function") {
                    this.props.onNavigation(this.state.page, this.state.itemsOnPage, (orderDesc ? "-" : "") + orderBy);
                }
            });
        } else {
            this.setState({ loading: true }, () => {
                const order = (orderDesc ? "-" : "") + orderBy;
                this.props.getData(itemsOnPage, skip, order).then(
                    (res) => {
                        if (this.unmounted) {
                            return;
                        }
                        newState.items = res.items || [];
                        newState.length = res.fullCount;
                        this.setState(newState);
                    },
                    (error) => {
                        if (this.unmounted) {
                            return;
                        }
                        this.setState({ loading: false });
                    },
                );
            });
        }
    }

    passVisibleColumns(excludedColumns) {
        if (typeof this.props.setVisibleColumns !== "function") {
            return;
        }

        excludedColumns = excludedColumns || this.state.excludedColumns;
        const columns = this.state.columns
            .filter((column) => !excludedColumns.includes(column.prop))
            .map((e) => e.prop);
        this.props.setVisibleColumns(columns);
    }

    toggleSelect(e) {
        const id = e.currentTarget.getAttribute("data-id");
        const item = find.item(this.state.items, id);
        this.props.onSelect(item);
    }

    toggleSelectAll(e) {
        const clear = e.currentTarget.getAttribute("data-clear") === "true";
        const items = this.state.items.filter((i) => (clear ? this.props.isSelected(i) : !this.props.isSelected(i)));
        this.props.onSelect(items);
    }

    toggleColumn(column) {
        const excludedColumns = this.state.excludedColumns.slice();
        const idx = excludedColumns.indexOf(column);
        if (idx === -1) {
            if (this.state.columns.length === this.state.excludedColumns.length + 1) {
                return;
            }

            excludedColumns.push(column);
        } else {
            excludedColumns.splice(idx, 1);
        }

        this.setState({ excludedColumns });
        localStorage.setItem(this.getExcludedColumnsKey(), JSON.stringify(excludedColumns));
        this.passVisibleColumns(excludedColumns);
    }

    getExcludedColumnsKey() {
        return `${this.props.parentStoreName ? this.props.parentStoreName + "-" : ""}${
            this.props.storeName
        }-excludedColumns`;
    }

    getExcludedColumns() {
        let excludedColumns = [];
        const savedExcludedColumns = localStorage.getItem(this.getExcludedColumnsKey());
        if (savedExcludedColumns) {
            excludedColumns = JSON.parse(savedExcludedColumns);

            return excludedColumns;
        }

        excludedColumns = this.state.columns.filter((e) => e.optional).map((e) => e.prop);
        localStorage.setItem(this.getExcludedColumnsKey(), JSON.stringify(excludedColumns));

        return excludedColumns;
    }

    linkClickHandler(storeName, itemId) {
        return (e) => {
            e.preventDefault();
            historyActions.goToStoreItem(storeName, itemId);
        };
    }

    render() {
        const { props: propsDesc } = this.props.storeDesc;
        const headerModel = { $i18n: i18n.getForStore(this.props.storeName) };
        const visibleColumns = this.state.columns.filter((column) => !this.state.excludedColumns.includes(column.prop));
        const header = visibleColumns.map((column, index) => {
            const orderBy = column.orderBy || column.prop;
            const className = cn(
                {
                    number: column.type === propertyTypes.int || column.type === propertyTypes.float,
                    order: this.state.orderBy === orderBy,
                    desc: this.state.orderBy === orderBy && this.state.orderDesc,
                    sortable: !column.disableOrder,
                },
                column.className,
            );

            const style = column.style || {};
            const label = column.label(headerModel);
            const icon = column.icon ? column.icon.trim() : null;

            return (
                <th
                    className={className}
                    key={column.prop + "-" + index}
                    onClick={column.disableOrder || this.state.loading ? null : this.handleOrder.bind(this, orderBy)}
                    style={style}
                >
                    <Icon icon={icon} />
                    {label}
                </th>
            );
        });

        if (this.props.selectable) {
            let allSelected = false;
            for (const item of this.state.items) {
                allSelected = true;
                if (!this.props.isSelected(item)) {
                    allSelected = false;
                    break;
                }
            }

            header.unshift(
                <th key="$select-all" className="checkbox">
                    <button
                        type="button"
                        data-clear={allSelected}
                        onClick={this.toggleSelectAll}
                        className="btn-icon first last"
                    >
                        <i className="material-icons light-secondary md-18 text">
                            {allSelected ? "check_box" : "check_box_outline_blank"}
                        </i>
                    </button>
                </th>,
            );
        }

        const length = this.props.items ? this.props.items.length : this.state.length;
        const data = [];
        const skip = this.state.page * this.state.itemsOnPage;
        const max = Math.min(skip + this.state.itemsOnPage, length);
        const items = this.state.items;
        for (var i = 0; i < items.length; i++) {
            const item = items[i] || {};
            const columns = visibleColumns.map((column) => {
                let text = "",
                    className = "";
                if (column != null) {
                    switch (column.type) {
                        case propertyTypes.date:
                            if (item[column.prop]) {
                                var date = column.utc ? moment.utc(item[column.prop]) : moment(item[column.prop]);
                                text = date.format(column.format || "DD.MM.YYYY - HH:mm:ss, dd");
                            }
                            break;
                        case propertyTypes.link:
                            text = <i className="fa fa-download" />;
                            break;
                        case propertyTypes.bool:
                            text = item[column.prop] ? (
                                <i className="fa fa-check-square" />
                            ) : (
                                <i className="fa fa-square-o" />
                            );
                            break;
                        case "virtual/client": {
                            // TODO: move "virtual/client" to constants
                            const propDesc = propsDesc[column.prop];
                            const itemCopy = JSON.parse(JSON.stringify(item));
                            changesProcessor.combineItem(itemCopy);
                            text = propDesc.$load(
                                itemCopy,
                                i18n.getForStore(this.props.storeName),
                                credentialsStore.getUser(),
                                this.props.index,
                            );
                            break;
                        }
                        default: {
                            let res = item[column.prop];
                            if (column.options) {
                                for (let i = 0; i < column.options.length; i++) {
                                    if (res === column.options[i].value) {
                                        res = column.options[i].label({
                                            $i18n: i18n.getForStore(this.props.storeName),
                                        });
                                    }
                                }
                            }

                            text = res;
                        }
                    }
                    switch (column.display) {
                        case displayTypes.audio:
                            text = <AudioControls src={item[column.prop]} />;
                            break;
                        case displayTypes.html:
                            text = (
                                <Html
                                    html={column.html}
                                    model={{ value: item[column.prop] }}
                                    noSanitize={column.noSanitize}
                                />
                            );
                            break;
                        case displayTypes.react: {
                            const componentProps = {
                                storeName: this.state.storeName,
                                storeDesc: this.state.storeDesc,
                                ready: this.state.ready,
                                store: this.state.store,
                                actions: itemsActions,
                                parentItem: this.props.parentItem,
                                parentStoreName: this.props.parentStoreName,
                                onCellClick: this.props.onCellClick,
                                user: credentialsStore.getUser(),
                                item,
                            };

                            text = React.createElement(column.$component, componentProps);
                            break;
                        }
                        case displayTypes.searchBox: {
                            const componentProps = {
                                storeName: this.state.storeName,
                                storeDesc: this.state.storeDesc,
                                propDesc: propsDesc[column.prop],
                                ready: this.state.ready,
                                store: this.state.store,
                                user: credentialsStore.getUser(),
                                value: item[column.prop],
                            };

                            text = <SearchBox {...componentProps} />;
                        }
                    }
                    if (column.tableLink) {
                        const storeName = column.store ? column.store : this.props.storeName;
                        const itemId = column.foreignKey ? item[column.foreignKey] : item._id;
                        const to = config.findRoute(storeName) + "/" + itemId;
                        text = (
                            <a href={to} onClick={this.linkClickHandler(storeName, itemId)}>
                                {text}
                            </a>
                        );
                    }
                    className = cn(column.className ? column.className : "", {
                        number: column.type === propertyTypes.int || column.type === propertyTypes.float,
                    });
                }
                return (
                    <td className={className} key={(item._id || i) + "-" + column.prop}>
                        <div style={column.style}>{text}</div>
                    </td>
                );
            });

            if (this.props.selectable) {
                columns.unshift(
                    <td className="table-check" key={(item._id || i) + "-" + "$select"}>
                        <button
                            type="button"
                            data-id={item._id}
                            data-selected={item._selected ? 1 : 0}
                            onClick={this.toggleSelect}
                            className="btn-icon first last"
                        >
                            <i className="material-icons light-secondary md-18 text">
                                {this.props.isSelected(item) ? "check_box" : "check_box_outline_blank"}
                            </i>
                        </button>
                    </td>,
                );
            }

            const className = cn({
                active: this.props.activeItemId === item._id,
            });

            data.push(
                <tr key={"r-" + (item._id || i)} className={className}>
                    {columns}
                </tr>,
            );
        }

        if (!this.props.dynamicHeight && data.length < this.state.itemsOnPage && length > this.state.itemsOnPage) {
            for (let i = data.length; i < this.state.itemsOnPage; i++) {
                data.push(<tr key={"r-" + i} />);
            }
        }

        const className = cn({
            "pd-data-table": true,
            loading: this.state.loading,
        });
        return (
            <div className="relative">
                <ColumnsSelector
                    columns={this.state.columns}
                    excludedColumns={this.state.excludedColumns}
                    toggleColumn={this.toggleColumn}
                />
                <div style={{ overflowX: "auto" }}>
                    <table className={className}>
                        <thead>
                            <tr>{header}</tr>
                        </thead>
                        <tbody>{data}</tbody>
                    </table>
                </div>
                <div className="pd-table-card-footer">
                    {this.state.loading ? <i className="loader fa fa-spinner fa-spin m-r-32" /> : null}
                    <span>{i18n.get("common.recordsOnPage")}</span>
                    <div className="select-control inline m-r-32 m-l-32">
                        <select
                            className="form-control"
                            value={this.state.itemsOnPage}
                            onChange={this.handleItemsOnPageChange.bind(this)}
                            disabled={this.state.loading}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <i className="material-icons arrow">arrow_drop_down</i>
                    </div>
                    {this.state.items.length > 0 ? skip + 1 : 0} - {max}&nbsp;/&nbsp;{length}
                    <button
                        onClick={this.handlePagination.bind(this, false)}
                        disabled={this.state.page < 1 || this.state.loading}
                        className="btn-flat m-l-32"
                    >
                        <i className="fa fa-angle-left" />
                    </button>
                    <button
                        onClick={this.handlePagination.bind(this, true)}
                        disabled={this.state.page >= length / this.state.itemsOnPage - 1 || this.state.loading}
                        className="btn-flat m-r-14 m-l-24"
                    >
                        <i className="fa fa-angle-right" />
                    </button>
                </div>
            </div>
        );
    }
}

DataTable.propTypes = {};
DataTable.defaultProps = {};

export default DataTable;
