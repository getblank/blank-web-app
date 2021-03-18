import React, { Component } from "react";
import cn from "classnames";
import config from "../../../stores/configStore";
import historyActions from "../../../actions/historyActuators";
import { propertyTypes } from "constants";

class Table extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.state.orderBy = "";
        this.state.orderDesc = false;
    }

    orderHandler(column) {
        if (typeof this.props.onOrder === "function") {
            const desc = this.props.orderBy === column;
            this.props.onOrder((desc ? "-" : "") + column);
        }
    }

    linkClickHandler(storeName, itemId) {
        return (e) => {
            e.preventDefault();
            historyActions.goToStoreItem(storeName, itemId);
        };
    }

    render() {
        let totals = null;
        let { data } = this.props;
        const columnsDescs = this.props.columns ?? [];
        if (data.items) {
            totals = data.totals;
            data = data.items;
        }
        const header = columnsDescs.map((column, index) => {
            const className = cn(
                {
                    number: column.type === propertyTypes.int || column.type === propertyTypes.float,
                    order: this.props.orderBy && this.props.orderBy.replace(/^-/, "") === column.key,
                    desc: this.props.orderBy && this.props.orderBy === "-" + column.key,
                    sortable: !column.disableOrder,
                },
                column.className,
            );
            return (
                <th
                    className={className}
                    key={column.key + "-" + index}
                    onClick={
                        column.disableOrder || this.state.loading ? null : this.orderHandler.bind(this, column.key)
                    }
                >
                    {column.label}
                </th>
            );
        });
        let footer = null;
        if (totals) {
            footer = columnsDescs.map((c) => {
                const className = cn(
                    { number: [propertyTypes.int, propertyTypes.float].indexOf(c.type) >= 0 },
                    c.className,
                );
                return (
                    <td key={"td-f-" + c.key} className={className}>
                        {totals[c.key]}
                    </td>
                );
            });
        }
        const rows = data.map((item, i) => {
            const columns = [];
            for (const column of columnsDescs) {
                const className = cn(
                    { number: [propertyTypes.int, propertyTypes.float].indexOf(column.type) >= 0 },
                    column.className,
                );
                let text = item[column.key];
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

                columns.push(
                    <td key={"td-" + i + "-" + column.key} className={className}>
                        {text}
                    </td>,
                );
            }
            return <tr key={"tr-" + i}>{columns}</tr>;
        });

        const className = cn("pd-data-table", this.props.className);
        return (
            <div style={{ overflowX: "auto" }}>
                <table className={className}>
                    <thead>
                        <tr>{header}</tr>
                    </thead>
                    {totals && (
                        <tfoot>
                            <tr>{footer}</tr>
                        </tfoot>
                    )}
                    <tbody>{rows}</tbody>
                </table>
            </div>
        );
    }
}

export default Table;
