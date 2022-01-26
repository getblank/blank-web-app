import React from "react";
import PropTypes from "prop-types";
import EditorBase from "./EditorBase";
import SimpleInput from "./inputs/SimpleInput";
import ObjectList from "./inputs/object/ObjectList";
import WidgetProperty from "./viewers/WidgetProperty";
import VirtualRefList from "./inputs/select/VirtualRefList";
import ActionProperty from "./inputs/btn/ActionProperty";
import Comments from "./inputs/comments/Comments";
import Loader from "../misc/Loader";
import i18n from "../../stores/i18nStore.js";
import changesProcessor from "../../utils/changesProcessor.js";
import { propertyTypes, displayTypes } from "constants";
import classNames from "classnames";
import template from "template";
import validation from "validation";

const columnWidth = 330;

export default class SimpleForm extends EditorBase {
    constructor(props) {
        super(props);
        this.state = { item: this.getItem(props), columnCount: 1, loading: false };
        this.cancel = this.cancel.bind(this);
        this.save = this.save.bind(this);
    }

    componentWillReceiveProps(next) {
        this.setState({ item: this.getItem(next) });
    }

    componentDidMount() {
        this.componentDidRender();
    }

    componentDidUpdate() {
        this.componentDidRender();
    }

    componentDidRender() {
        const { loading, item } = this.state;
        //Checking form column count
        const form = this.form;
        if (form == null) {
            return;
        }

        const columnCount = Math.floor(form.offsetWidth / columnWidth);
        if (columnCount !== this.state.columnCount) {
            this.setState(() => ({ columnCount: columnCount }));
        }
        if (loading && item.$error) {
            this.setState(() => ({ loading: false }));
        }
    }

    render() {
        if (this.state.item == null) {
            return (
                <div>
                    <h2>{i18n.get("form.e404")}</h2>

                    <p>{i18n.get("form.e404prompt")}</p>
                </div>
            );
        }

        const { item, loading } = this.state;
        const { storeDesc, itemVersion } = this.props;
        const combinedItem = changesProcessor.combineItem(item, true, true);
        const user = this.props.user || { _id: null };
        const access = storeDesc.groupAccess + (user._id === item._ownerId ? storeDesc.ownerAccess : "");
        const fieldControls = [];

        if (item != null) {
            const propGroups = this.getPropGroupsMap(
                storeDesc,
                Object.assign({ $user: user }, item, item.$changedProps),
            );
            const hc = this.handleChange.bind(this);
            const hf = this.handleFocus.bind(this);
            const hb = this.handleBlur.bind(this);
            //Creating inputs for each group in their order
            for (const [key, value] of propGroups) {
                const groupControl = [];
                const kIndex = typeof key === "object" ? key._id : key;
                let firstInput = true;
                let wrapperNumber = 0;
                const wrappedInputs = [];
                for (const field of value) {
                    if (EditorBase.isPropHidden(storeDesc, field, user, combinedItem, this.props.tab)) {
                        continue;
                    }

                    field.readOnly = field.readOnly || itemVersion != null;

                    let input;
                    const props = {
                        key: field.name,
                        fieldName: field.name,
                        field: field,
                        propName: field.name,
                        propDesc: field,
                        storeName: this.props.storeName,
                        storeDesc: this.props.storeDesc,
                        item: this.state.item,
                        combinedItem: combinedItem,
                        onChange: hc,
                        onFocus: hf,
                        onBlur: hb,
                        readOnly: access.indexOf("u") < 0 || field.readOnly,
                        user: user,
                        performAction: this.props.performAction,
                    };
                    switch (field.type) {
                        case propertyTypes.virtualRefList:
                            props.actions = this.props.actions;
                            input = React.createElement(VirtualRefList, props);
                            break;
                        case propertyTypes.action:
                            input = React.createElement(ActionProperty, props);
                            break;
                        case propertyTypes.object:
                        case propertyTypes.objectList:
                            props.required = field.required;
                            props.minLength = field.minLength;
                            props.multi = field.type === "objectList";
                            props.maxLength = field.maxLength;
                            if (field.display === displayTypes.react) {
                                input = React.createElement(SimpleInput, props);
                            } else {
                                input = React.createElement(ObjectList, props);
                            }
                            break;
                        case propertyTypes.comments:
                            props.actions = this.props.actions;
                            input = React.createElement(Comments, props);
                            break;
                        case propertyTypes.widget:
                            props.storeDesc = this.props.storeDesc;
                            input = React.createElement(WidgetProperty, props);
                            break;
                        default:
                            input = React.createElement(SimpleInput, props);
                            break;
                    }

                    if (input) {
                        if (firstInput && key) {
                            const groupLabel =
                                typeof key === "object"
                                    ? template.render(key.label, { $i18n: i18n.getForStore(this.props.storeName) })
                                    : template.render(key, { $i18n: i18n.getForStore(this.props.storeName) });
                            if (groupLabel.trim()) {
                                groupControl.push(
                                    <div className="group-label" key={kIndex + "-group"}>
                                        <span>{groupLabel}</span>
                                    </div>,
                                );
                            }

                            firstInput = false;
                        }

                        if (
                            storeDesc.display && // "Store" in actions does't have display property
                            (field.name === storeDesc.headerProperty || field.display === displayTypes.headerInput)
                        ) {
                            continue;
                        }

                        if (field.type === propertyTypes.objectList || field.type === propertyTypes.object) {
                            if (wrappedInputs.length) {
                                groupControl.push(
                                    <div className="fields-wrapper" key={kIndex + "-" + wrapperNumber}>
                                        {wrappedInputs.slice()}
                                    </div>,
                                );
                            }

                            wrappedInputs.length = 0;
                            groupControl.push(input);
                            wrapperNumber++;
                        } else {
                            wrappedInputs.push(input);
                        }
                    }
                }
                if (wrappedInputs.length) {
                    groupControl.push(
                        <div className="fields-wrapper" key={kIndex + "-" + wrapperNumber}>
                            {wrappedInputs}
                        </div>,
                    );
                }
                if (groupControl.length) {
                    let order = 0;
                    if (typeof key.hidden === "function" && key.hidden(user, item, undefined, combinedItem) === true) {
                        continue;
                    }
                    if (typeof key.formOrder === "function") {
                        order = key.formOrder(user, item);
                    }
                    fieldControls.push(
                        <div
                            style={key.style || {}}
                            order={order}
                            className={key.className || ""}
                            key={`${kIndex}-fieldControls`}
                        >
                            {groupControl}
                        </div>,
                    );
                }
            }
        }

        fieldControls.sort((a, b) => a.props.order - b.props.order);

        const canSave = changesProcessor.canSave(item);
        const hideSave = access.indexOf("u") < 0 && item.$state !== "new";
        const hideCancel = (this.props.directWrite && !this.props.cancel) || this.props.hideCancel || hideSave;
        const cn = classNames(this.props.className, {
            "editor-form": true,
            dark: this.props.dark,
            "multi-column": this.state.columnCount > 1,
        });

        if (this.props.verySimple) {
            return (
                <div
                    ref={(e) => {
                        this.form = e;
                    }}
                    id={this.props.id}
                    className={cn}
                >
                    {fieldControls}
                </div>
            );
        }

        if (this.props.noForm) {
            return (
                <div
                    ref={(e) => {
                        this.form = e;
                    }}
                    id={this.props.id}
                    className={cn}
                    autoComplete={this.props.disableAutoComplete ? "off" : ""}
                >
                    {this.props.disableAutoComplete ? (
                        <input
                            type="text"
                            name="fakeusernameremembered"
                            style={{ position: "absolute", opacity: "0", zIndex: "-1" }}
                        />
                    ) : null}
                    {this.props.disableAutoComplete ? (
                        <input
                            type="password"
                            id="password"
                            name="password"
                            style={{ position: "absolute", opacity: "0", zIndex: "-1" }}
                        />
                    ) : null}

                    {fieldControls}

                    {this.props.hideButtons ? null : (
                        <div className={this.props.buttonsContainerClassName}>
                            <button
                                type="submit"
                                className={(this.props.saveClass || "btn-default") + (hideSave ? " hidden" : "")}
                                disabled={!canSave}
                                onClick={this.save}
                            >
                                {this.props.saveIcon == null ? null : (
                                    <i className="material-icons text md-18">{this.props.saveIcon}</i>
                                )}
                                {this.props.saveText == null ? i18n.get("form.save") : this.props.saveText}
                            </button>
                            {hideCancel ? null : (
                                <button
                                    type="button"
                                    className={(this.props.cancelClass || "btn-flat") + (hideCancel ? " hidden" : "")}
                                    disabled={!changesProcessor.canUndo(item)}
                                    onClick={this.cancel}
                                >
                                    {this.props.cancelIcon == null ? null : (
                                        <i className="material-icons text md-18">{this.props.cancelIcon}</i>
                                    )}
                                    {this.props.cancelText == null ? i18n.get("form.cancel") : this.props.cancelText}
                                </button>
                            )}
                            <Loader className={"xs saving-loader" + (item.$state === "saving" ? "" : " hidden")} />
                        </div>
                    )}
                </div>
            );
        }

        return (
            <form
                ref={(e) => {
                    this.form = e;
                }}
                id={this.props.id}
                className={cn}
                autoComplete={this.props.disableAutoComplete ? "off" : ""}
            >
                {this.props.disableAutoComplete ? (
                    <input
                        type="text"
                        name="fakeusernameremembered"
                        style={{ position: "absolute", opacity: "0", zIndex: "-1" }}
                    />
                ) : null}
                {this.props.disableAutoComplete ? (
                    <input
                        type="password"
                        id="password"
                        name="password"
                        style={{ position: "absolute", opacity: "0", zIndex: "-1" }}
                    />
                ) : null}

                {fieldControls}

                {this.props.hideButtons ? null : (
                    <div className={this.props.buttonsContainerClassName}>
                        <button
                            type="submit"
                            className={(this.props.saveClass || "btn-default") + (hideSave ? " hidden" : "")}
                            disabled={!canSave || loading}
                            onClick={this.save}
                        >
                            {this.props.saveIcon == null ? null : (
                                <i className="material-icons text md-18">{this.props.saveIcon}</i>
                            )}
                            {this.props.saveText == null ? i18n.get("form.save") : this.props.saveText}
                        </button>
                        {hideCancel ? null : (
                            <button
                                type="button"
                                className={(this.props.cancelClass || "btn-flat") + (hideCancel ? " hidden" : "")}
                                disabled={!changesProcessor.canUndo(item) || loading}
                                onClick={this.cancel}
                            >
                                {this.props.cancelIcon == null ? null : (
                                    <i className="material-icons text md-18">{this.props.cancelIcon}</i>
                                )}
                                {this.props.cancelText == null ? i18n.get("form.cancel") : this.props.cancelText}
                            </button>
                        )}
                        <Loader
                            className={"xs saving-loader" + (item.$state === "saving" || loading ? "" : " hidden")}
                        />
                    </div>
                )}
            </form>
        );
    }

    save(e) {
        e.preventDefault();
        const { forStore } = this.props;
        const invalidProps = validation.validate(this.props.storeDesc, this.props.item, null, this.props.user);

        if (Object.keys(invalidProps).length > 0) {
            const invalid = this.form.querySelector(".invalid input");
            if (invalid) {
                invalid.focus();
            }

            if (typeof this.props.onSubmitError === "function") {
                this.props.onSubmitError();
            }

            return;
        }

        if (typeof this.props.onSubmit === "function") {
            if (forStore) {
                this.setState(() => ({ loading: true }));
            }
            this.props.onSubmit();
        }
    }

    cancel() {
        if (typeof this.props.cancel === "function") {
            this.props.cancel();
        } else {
            this.state.item.$changedProps = {};
            this.emitChange(this.state.item);
        }
    }
}
SimpleForm.propTypes = { storeDesc: PropTypes.object.isRequired };
SimpleForm.defaultProps = { actions: {} };
