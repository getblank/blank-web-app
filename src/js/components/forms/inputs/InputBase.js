/**
 * Created by kib357 on 13/01/16.
 */

import React from "react";
import i18n from "../../../stores/i18nStore.js";
import credentialsStore from "../../../stores/credentialsStore.js";
import changesProcessor from "../../../utils/changesProcessor";

class InputBase extends React.Component {
    constructor(props) {
        super(props);
    }

    getTemplateModel() {
        return {
            $i18n: i18n.getForStore(this.props.storeName),
            $item: this.props.item,
            $user: this.props.user,
        };
    }

    getValue(props) {
        const { field: propDesc, fieldName: propName, item, storeName } = (props || this.props);
        if (!item) {
            return null;
        }

        if (propDesc.type === "virtual/client") {
            const itemCopy = JSON.parse(JSON.stringify(item));
            changesProcessor.combineItem(itemCopy);
            return propDesc.$load(itemCopy, i18n.getForStore(storeName), credentialsStore.getUser(), this.props.index);
        }

        const changedProps = item.$changedProps;
        if (changedProps && changedProps.hasOwnProperty(propName)) {
            return changedProps[propName];
        }

        return item[propName];
    }

    isChanged(props) {
        let { fieldName, item } = (props || this.props);
        return item.$changedProps && item.$changedProps.hasOwnProperty(fieldName);
    }

    isDirty(props) {
        let { fieldName, item } = (props || this.props);
        return item.$dirtyProps && item.$dirtyProps.hasOwnProperty(fieldName);
    }

    render() {
        return (
            <div>InputBase</div>
        );
    }
}

InputBase.propTypes = {};
InputBase.defaultProps = {};

export default InputBase;
