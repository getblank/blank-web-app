/**
 * Created by kib357 on 28/12/15.
 */

import React from "react";
import SimpleInput from "../forms/inputs/SimpleInput";
import i18n from "../../stores/i18nStore";
import credentialsStore from "../../stores/credentialsStore";
import changesProcessor from "../../utils/changesProcessor";
import template from "template";
import { storeTypes, storeDisplayTypes } from "constants";

let inputConfig = {
    type: "string",
    display: "headerInput",
};

class ItemName extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.changeHandler = this.changeHandler.bind(this);
    }

    changeHandler(fieldName, value) {
        const item = changesProcessor.handle(this.props.item, fieldName, value);
        if (typeof this.props.onChange === "function") {
            this.props.onChange(item);
        }
    }

    render() {
        let headerTemplate = this.props.storeDesc.headerTemplate;
        const { storeDesc, item, itemVersion } = this.props;
        if (storeDesc.type === storeTypes.single || storeDesc.display === storeDisplayTypes.single) {
            headerTemplate = storeDesc.label;
        }

        if (headerTemplate) {
            const text = template.render(headerTemplate, {
                $item: this.props.combinedItem,
                $i18n: i18n.getForStore(this.props.storeName),
            });

            return (
                <div className="item-name fill">
                    <h1>{text}</h1>
                </div>
            );
        }

        const headerProperty = storeDesc.headerProperty || "name";
        if (storeDesc.props[headerProperty] == null) {
            console.warn("Config for header property not found! Property:", headerProperty);
            return null;
        }

        const headerDesc = Object.assign({}, storeDesc.props[headerProperty], inputConfig);
        const access =
            storeDesc.groupAccess + (credentialsStore.getUser()._id === item._ownerId ? storeDesc.ownerAccess : "");
        const readOnly = access.indexOf("u") < 0 || itemVersion != null;

        return (
            <div className="item-name fill dark">
                <SimpleInput
                    storeName={this.props.storeName}
                    fieldName={headerProperty}
                    field={headerDesc}
                    item={this.props.item}
                    combinedItem={this.props.combinedItem}
                    readOnly={readOnly}
                    onChange={this.changeHandler}
                />
            </div>
        );
    }
}

ItemName.propTypes = {};
ItemName.defaultProps = {};

export default ItemName;
