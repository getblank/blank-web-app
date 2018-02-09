/**
 * Created by kib357 on 16/08/15.
 */

import React from "react";
import Actions from "../actions/Actions";
import Labels from "../labels/Labels";
import Loader from "../misc/Loader";
import historyActions from "../../actions/historyActuators";
import cn from "classnames";
import randomColors from "../../utils/colors";

const colors = new randomColors();

class GridView extends React.Component {
    constructor(props) {
        super(props);
        this.createClickHandler = this.createClickHandler.bind(this);
    }

    selectItem(itemId) {
        historyActions.goToStoreItem(this.props.storeName, itemId);
    }

    sortedItems() {
        const { storeDesc } = this.props;
        const items = [...this.props.items];
        if (storeDesc.orderBy) {
            const splittedOrderBy = storeDesc.orderBy.split(",").map(e => e.trim());
            items.sort((a, b) => {
                for (let orderBy of splittedOrderBy) {
                    const descending = orderBy && orderBy[0] === "-" ? -1 : 1;
                    orderBy = descending === -1 ? orderBy.slice(1) : orderBy;
                    if (a[orderBy] !== b[orderBy]) {
                        const greater = a[orderBy] > b[orderBy] ? 1 : -1;
                        return greater * descending;
                    }
                }

                return 0;
            });
        }

        return items;
    }

    createClickHandler() {
        this.props.actions.create(this.props.storeName, null);
    }

    render() {
        colors.reset();
        const { storeDesc } = this.props;
        const showLabels = storeDesc.labels && storeDesc.labels.some((l) => {
            return l.showInList > 0;
        });

        const viewOnly = this.props.storeDesc.groupAccess.indexOf("u") === -1;
        const items = this.sortedItems();
        const cards = items.reduce((prev, item, index) => {
            const mediaCn = cn("card-media", {
                action: !viewOnly,
                changed: item.$state !== "ready",
            });
            const descCn = cn("card-desc", {
                action: !viewOnly,
            });

            const headerProperty = storeDesc.headerProperty || "name";

            const card = (
                <div className="pd-card" key={"card-" + item._id}>
                    <div className={mediaCn} style={{ backgroundColor: item.color || colors.get() }}
                        onClick={viewOnly ? null : this.selectItem.bind(this, item._id)}>
                        <span className="card-title">{item[headerProperty]}</span>
                    </div>
                    {showLabels ?
                        <div className={descCn}
                            onClick={viewOnly ? null : this.selectItem.bind(this, item._id)}>
                            <Labels item={item}
                                storeDesc={storeDesc}
                                storeName={this.props.storeName}
                                ready={this.props.ready} />
                        </div> : null}
                    <div className="card-actions">
                        <Actions item={item}
                            storeName={this.props.storeName}
                            storeDesc={storeDesc}
                            execute={this.props.actions.performAction}
                            modalFormActions={true} />
                    </div>
                </div>
            );

            prev.push(card);
            if (storeDesc.type === "process" && index < items.length - 1) {
                const prevItem = items[index + 1];
                if (item._state !== prevItem._state) {
                    prev.push(<div key={`breaker-${item._id}`} style={{ flexBasis: "100%", width: "0px", height: "0px", overflow: "hidden" }}></div>);
                }
            }

            return prev;
        }, []);

        return (
            <div className="fill relative flex column layout-grid">
                <div className="scroll fill">
                    <div className="grid-wrapper">
                        {this.props.ready ?
                            <div className="pd-grid">
                                {cards}
                                {this.props.storeDesc.groupAccess.indexOf("c") >= 0 ?
                                    <div className="pd-card" onClick={this.createClickHandler}>
                                        <div className="card-media action" style={{ backgroundColor: "#757575" }}>
                                            <div>
                                                <i className="material-icons md-36 m-r-8"
                                                    style={{ verticalAlign: "bottom" }}>add_circle_outline</i>
                                                <span
                                                    className="card-title">{(this.props.storeDesc.i18n || {}).createLabel || ""}</span>
                                            </div>
                                        </div>
                                    </div> : null}
                            </div> :
                            <Loader />
                        }
                    </div>
                </div>
            </div>
        );
    }
}

GridView.propTypes = {};
GridView.defaultProps = {};

export default GridView;
