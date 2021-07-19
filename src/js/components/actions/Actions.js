/**
 * Created by kib357 on 14/08/15.
 */

import React from "react";
import PropTypes from "prop-types";
import ActionActuator from "./ActionActuator";
import SimpleForm from "../forms/SimpleForm";
import credentialsStore from "../../stores/credentialsStore";
import configStore from "../../stores/configStore";
import currentActionStore from "../../stores/currentActionStore";
import currentActionActions from "../../actions/currentActionActuators";
import filtersStore from "../../stores/filtersStore";
import i18n from "../../stores/i18nStore";
import { storeEvents } from "constants";
import find from "utils/find";
import classNames from "classnames";
import template from "template";

class Actions extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.state.executingAction = false;
        this.state.currentAction = "";
        this.state.data = {};
        this.state.formInvalid = true;
        this.clearCurrentAction = this.clearCurrentAction.bind(this);
        this.closeForm = this.closeForm.bind(this);
        this.getDefaultData = this.getDefaultData.bind(this);
        this.keyUpHandler = this.keyUpHandler.bind(this);
        this._onChange = this._onChange.bind(this);
    }

    componentDidMount() {
        currentActionStore.on(storeEvents.CHANGED, this._onChange);
    }

    componentWillUnmount() {
        currentActionStore.removeListener(storeEvents.CHANGED, this._onChange);
    }

    _onChange() {
        let currentActionInfo = currentActionStore.getInfo();
        if (currentActionInfo.storeName === this.props.storeName && currentActionInfo.itemId == this.props.item._id) {
            this.setState({ currentAction: currentActionInfo.actionId, data: currentActionStore.get() });
        } else {
            this.setState({ currentAction: "", data: null });
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.currentAction !== prevState.currentAction && typeof this.props.onCurrentChanged === "function") {
            this.props.onCurrentChanged(this.state.currentAction || null);
        }
    }

    performAction(e, extraData) {
        let actionId = this.state.currentAction;
        let openForm = false;

        if (e != null) {
            if (typeof e === "string") {
                actionId = e;
            } else {
                e.preventDefault();
                actionId = e.currentTarget.getAttribute("data-action");
            }
            openForm = true;
        }

        let actionsDesc = this.props.actionsDesc || [];
        let actionDesc = find.itemById(actionsDesc, actionId);
        if (!actionDesc) {
            actionsDesc =
                (this.props.forStore ? this.props.storeDesc.storeActions : this.props.storeDesc.actions) || [];
            actionDesc = find.itemById(actionsDesc, actionId);
        }

        if (openForm && actionDesc && actionDesc.props != null) {
            const { storeName, item } = this.props;
            const defaultData = this.getDefaultData(actionId, item);
            if (extraData) {
                Object.assign(defaultData, extraData);
            }

            currentActionActions.selectCurrentAction(storeName, item._id || null, actionId, defaultData);
            return;
        }

        const data = Object.assign({}, this.state.data || {}, extraData);
        for (const key of Object.keys(data)) {
            if (/^\$.+/.test(key)) {
                delete data[key];
            }
        }

        if (actionDesc.type === "http") {
            const href = configStore.getHttpActionHref(
                this.props.storeName,
                actionDesc,
                this.props.forStore ? null : this.props.item._id,
                filtersStore,
                data,
            );
            const a = this.refs.link;
            a.setAttribute("href", href);
            a.click();
            this.clearCurrentAction();
            return;
        }

        if (this.props.forStore) {
            this.props.execute(this.props.storeName, actionId, data);
        } else {
            this.props.execute(this.props.item, actionId, data, this.props.storeName);
        }
    }

    getDefaultData(actionId, baseItem) {
        return configStore.getBaseItem(this.props.storeName, this.props.item, actionId, this.props.forStore, baseItem);
    }

    keyUpHandler(e) {
        if (e.keyCode == 27 && this.state.currentAction) {
            this.clearCurrentAction();
        }
    }

    clearCurrentAction() {
        currentActionActions.cancel();
    }

    setDataTouched() {
        this.handleDataChange(Object.assign(this.state.data, { $touched: true }));
    }

    handleDataChange(data) {
        delete data.$state;
        currentActionActions.saveDraft(data);
    }

    closeForm(e) {
        if (e.target === this.refs.formContainer) {
            this.clearCurrentAction();
        }
    }

    render() {
        let currentAction = null;
        let currentActionDesc = null;
        const user = credentialsStore.getUser();
        const templateModel = {
            $i18n: i18n.getForStore(this.props.storeName),
            $user: credentialsStore.getUser(),
            $item: this.props.item,
        };
        const actionsDescs =
            this.props.actionsDesc ||
            configStore.getActions(this.props.storeName, { $user: user, $item: this.props.item }, this.props.forStore);

        if (this.state.currentAction) {
            currentActionDesc = currentActionStore.getCurrentDesc();
            const okLabel = template.render(currentActionDesc.okLabel || "", templateModel);
            const cancelLabel = template.render(currentActionDesc.cancelLabel || "", templateModel);
            currentAction = (
                <SimpleForm
                    storeDesc={currentActionDesc}
                    storeName={this.props.storeName}
                    item={Object.assign({}, this.state.data, {
                        $state: (this.props.item || {}).$state,
                        $mainItem: this.props.item,
                    })}
                    onChange={this.handleDataChange.bind(this)}
                    cancel={this.clearCurrentAction}
                    onSubmit={this.performAction.bind(this)}
                    onSubmitError={this.setDataTouched.bind(this)}
                    saveClass={"btn-flat last" + (this.props.dark ? " btn-flat-dark" : "")}
                    saveIcon={currentActionDesc.okLabel == null ? "check" : null}
                    saveText={okLabel}
                    cancelClass={"btn-flat first" + (this.props.dark ? " btn-flat-dark" : "")}
                    cancelIcon={currentActionDesc.cancelLabel == null ? "arrow_back" : null}
                    cancelText={cancelLabel}
                    buttonsContainerClassName="action-buttons"
                    directWrite={true}
                    user={user}
                    dark={this.props.dark}
                    forStore={this.props.forStore}
                />
            );
        }

        const actionControls = actionsDescs.map((actionDesc, index) => {
            const desc = Object.assign({ forStore: this.props.forStore, storeName: this.props.storeName }, actionDesc);

            return (
                <ActionActuator
                    key={actionDesc._id}
                    style={{ display: this.props.forHeader && actionDesc.hideInHeader ? "none" : "" }}
                    className={this.props.buttonsClassName}
                    actionDesc={desc}
                    item={this.props.item}
                    templateModel={templateModel}
                    first={index === 0}
                    last={index === actionsDescs.length - 1}
                    dontCheckReady={this.props.dontCheckReady}
                    dark={this.props.dark}
                    forStore={this.props.forStore}
                    onClick={this.performAction.bind(this)}
                    noLabel={this.props.noLabel}
                />
            );
        });

        if (actionControls.length === 0) {
            return null;
        }

        const containerCn = classNames(
            "item-actions",
            this.props.className,
            currentActionDesc && currentActionDesc.className ? currentActionDesc.className : "",
            {
                form: currentAction != null,
            },
        );

        const formTitleText =
            currentAction != null && this.props.modalFormActions ? currentActionDesc.formLabel(templateModel) : "";

        return (
            <div className={containerCn} onKeyUp={this.keyUpHandler}>
                {currentAction != null &&
                    (this.props.modalFormActions ? (
                        <div className="action-form-modal" ref="formContainer" onClick={this.closeForm}>
                            <div className={`action-form ${currentActionDesc.wide ? "wide" : ""}`}>
                                {formTitleText ? <span className="title m-b-14">{formTitleText}</span> : null}
                                {currentAction}
                            </div>
                        </div>
                    ) : (
                        currentAction
                    ))}
                {/*Showing actions buttons if no current action or current action renders as modal*/}
                {(currentAction == null || this.props.modalFormActions) && actionControls}
                <a ref="link" style={{ visibility: "collapsed", opacity: "0" }} target="_blank" />
            </div>
        );
    }
}

Actions.propTypes = {
    storeDesc: PropTypes.object.isRequired,
    execute: PropTypes.func.isRequired,
};
Actions.defaultProps = {};

export default Actions;
