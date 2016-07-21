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
        let header = (this.props.columns || []).map((column, index) => {
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
        let data = this.props.data.map((d, i) => {
            let columns = [];
            for (let c of this.props.columns) {
                let className = cn({
                    "number": c.type === propertyTypes.int || c.type === propertyTypes.float,
                }, c.className);
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
                    <tbody>
                        {data}
                    </tbody>
                </table>
            </div>
        );
    }
}

export default Table;