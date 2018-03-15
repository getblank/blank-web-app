/**
 * Created by kib357 on 23/12/15.
 */

import React from "react";
import Icon from "../misc/Icon";
import credentialsStore from "../../stores/credentialsStore.js";
import configStore from "../../stores/configStore";
import filtersStore from "../../stores/filtersStore.js";
import classnames from "classnames";

class ActionActuator extends React.Component {
    constructor(props) {
        super(props);
        const { actionDesc, templateModel } = props;

        this.state = {
            labelText: actionDesc.label(templateModel),
            icon: actionDesc.icon(templateModel),
        };
    }

    createMarkup(text) {
        return { __html: text };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.actionDesc && nextProps.actionDesc.dynamicLabel) {
            this.setState({
                labelText: nextProps.actionDesc.label(nextProps.templateModel),
                icon: nextProps.actionDesc.icon(nextProps.templateModel),
            });
        }
    }

    render() {
        const user = credentialsStore.getUser();
        const { actionDesc, item, dark, first, last, dontCheckReady, noLabel } = this.props;
        const http = actionDesc.type && actionDesc.type.toLowerCase() === "http" && actionDesc.props == null;
        let cn = classnames({
            "btn": http,
            "btn-flat": actionDesc.label && actionDesc.className == null,
            "btn-icon": !actionDesc.label && actionDesc.className == null,
            dark,
            first, // index === 0,
            last, // index === actionsDescs.length - 1
        }, actionDesc.className, this.props.className);

        const labelControl = (
            <span style={{ opacity: (item.$state === "action-" + actionDesc._id ? 0 : 1) }}>
                <Icon icon={this.state.icon} />
                {!noLabel && this.state.labelText}
            </span>
        );

        const disabled = (actionDesc.type !== "client" && !dontCheckReady && !actionDesc.disableItemReadyCheck && item.$state != "ready") ||
            actionDesc.disabled(user, item);

        if (http) {
            const href = configStore.getHttpActionHref(actionDesc.storeName, actionDesc, item._id, filtersStore, {});

            return (
                <a key={actionDesc._id} className={cn} disabled={disabled}
                    href={href} target="_blank" tabIndex="-1">
                    {labelControl}
                </a>
            );
        }

        return (
            <button type="button"
                key={actionDesc._id}
                className={cn}
                style={Object.assign(actionDesc.style || {}, this.props.style)}
                data-action={actionDesc._id}
                disabled={disabled}
                tabIndex="-1"
                onClick={this.props.onClick}>
                {labelControl}
            </button>
        );
    }
}

ActionActuator.propTypes = {};
ActionActuator.defaultProps = {};

export default ActionActuator;
