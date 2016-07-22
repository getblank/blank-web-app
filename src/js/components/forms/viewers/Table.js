import React, {Component} from "react";
import cn from "classnames";
import {propertyTypes} from "constants";

class Table extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.state.orderBy = "";
        this.state.orderDesc = false;
    }

    orderHandler(column) {
        if (typeof this.props.onOrder === "function") {
            var desc = this.props.orderBy === column;
            this.props.onOrder((desc ? "-" : "") + column);
        }
    }

    render() {
        let totals = null, data = this.props.data, columnsDescs = (this.props.columns || []);
        if (data.items) {
            totals = data.totals;
            data = data.items;
        }
        let header = columnsDescs.map((column, index) => {
            let className = cn({
                "number": column.type === propertyTypes.int || column.type === propertyTypes.float,
                "order": this.props.orderBy && this.props.orderBy.replace(/^-/, "") === column.key,
                "desc": this.props.orderBy && this.props.orderBy === "-" + column.key,
                "sortable": !column.disableOrder,
            }, column.className);
            return (
                <th className={className} key={column.key + "-" + index}
                    onClick={column.disableOrder || this.state.loading ? null : this.orderHandler.bind(this, column.key) }>{column.label}</th>
            );
        });
        let footer = null;
        if (totals) {
            footer = columnsDescs.map(c => {
                let className = cn({ "number": [propertyTypes.int, propertyTypes.float].indexOf(c.type) >= 0 }, c.className);
                return <td key={"td-f-" + c.key} className={className}>{totals[c.key]}</td>;
            });
        }
        let rows = data.map((d, i) => {
            let columns = [];
            for (let c of columnsDescs) {
                let className = cn({ "number": [propertyTypes.int, propertyTypes.float].indexOf(c.type) >= 0 }, c.className);
                columns.push(<td key={"td-" + i + "-" + c.key} className={className}>{d[c.key]}</td>);
            }
            return <tr key={"tr-" + i}>{columns}</tr>;
        });
        let className = cn("pd-data-table", this.props.className);
        return (
            <div style={{ "overflowX": "auto" }}>
                <table className={className}>
                    <thead>
                        <tr>
                            {header}
                        </tr>
                    </thead>
                    {totals && <tfoot>
                        <tr>
                            {footer}
                        </tr>
                    </tfoot>}
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </div>
        );
    }
}

export default Table;