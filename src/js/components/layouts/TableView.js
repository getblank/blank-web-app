/**
 * Created by kib357 on 16/08/15.
 */

import React from "react";
import DataTable from "../misc/DataTable";
import Loader from "../misc/Loader";
import filtersStore from "../../stores/filtersStore";
import filtersActions from "../../actions/filtersActuators";

class TableView extends React.Component {
    constructor(props) {
        super(props);
        this.navigationHandler = this.navigationHandler.bind(this);
    }

    navigationHandler(page, pageSize, newOrder) {
        let order = filtersStore.getOrder(this.props.storeName, this.props.storeDesc.orderBy);
        if (newOrder && order !== newOrder) {
            filtersActions.setOrder(this.props.storeName, newOrder);
        } else {
            this.props.requestItems(page * pageSize);
        }
    }

    render() {
        return (
            <div className="fill flex column layout-table relative">
                <div className="scroll fill">
                    <div className="table-wrapper">
                        {this.props.ready ? (
                            <DataTable
                                storeDesc={this.props.storeDesc}
                                storeName={this.props.storeName}
                                items={this.props.items}
                                order={filtersStore.getOrder(this.props.storeName, this.props.storeDesc.orderBy)}
                                onNavigation={this.navigationHandler}
                                itemsOnPage={this.props.storeDesc.itemsOnPage}
                            />
                        ) : (
                            <Loader />
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

TableView.propTypes = {};
TableView.defaultProps = {};

export default TableView;
