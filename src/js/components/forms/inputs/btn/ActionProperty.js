/**
 * Created by kib357 on 23/12/15.
 */

import React from "react";
import PropTypes from "prop-types";
import ActionActuator from "../../../actions/ActionActuator.js";
import i18n from "../../../../stores/i18nStore.js";
import configStore from "../../../../stores/configStore";
import credentialsStore from "../../../../stores/credentialsStore";
import find from "utils/find";

class ActionProperty extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    performAction(e) {
        e.preventDefault();

        const actionId = e.currentTarget.getAttribute("data-action");
        this.props.performAction(actionId);
    }

    render() {
        const {storeName, item, readOnly} = this.props;
        let actions = this.props.propDesc.actions || [];
        if (!Array.isArray(actions)) {
            actions = [actions];
        }
        const actionsDescs = [],
            storeActions = configStore.getActions(storeName, { $user: credentialsStore.getUser(), $item: item });
        for (let action of actions) {
            if (typeof action === "string") {
                action = { _id: action };
            }
            const desc = find.item(storeActions, action._id);
            if (desc != null) {
                if (readOnly) {
                    desc.disabled = () => true;
                }
                actionsDescs.push(Object.assign({ storeName: this.props.storeName }, desc, action));
            }
        }

        const templateModel = {
            $i18n: i18n.getForStore(storeName),
            $item: item,
        };

        const actuators = actionsDescs.map((actionDesc, index) =>
            <ActionActuator key={actionDesc._id}
                actionDesc={actionDesc}
                item={(actionDesc.disableItemReadyCheck || actionDesc.type === "client") ? this.props.combinedItem : this.props.item}
                templateModel={templateModel}
                first={index === 0}
                last={index === actionsDescs.length - 1}
                onClick={this.performAction.bind(this) }/>);
        const style = this.props.propDesc.style;
        return (
            <div className="form-field actions-control" style={style}>
                {actuators}
            </div>
        );
    }
}

ActionProperty.propTypes = {
    storeName: PropTypes.string.isRequired,
    item: PropTypes.object.isRequired,
    propDesc: PropTypes.object.isRequired,
    performAction: PropTypes.func.isRequired,
};
ActionProperty.defaultProps = {};

export default ActionProperty;
