/**
 * Created by kib357 on 20/01/16.
 */

import React from "react";
import PropTypes from "prop-types";
import InputBase from "../InputBase";
import ObjectInput from "./ObjectInput";
import SimpleLabel from "../../SimpleLabel.js";
import configStore from "../../../../stores/configStore";
import i18n from "../../../../stores/i18nStore.js";
import find from "utils/find";
import { validityErrors } from "constants";
import template from "template";
import uuid from "uuid";

class ObjectList extends InputBase {
    constructor(props) {
        super(props);
        this.state = {};
        this.state.listItems = this.getValue();
        this.state.dragIndex = -1;
        this.handleDrag = this.handleDrag.bind(this);
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
    }

    componentWillUnmount() {
        clearTimeout(this.state.timer);
    }

    getValue(props) {
        const value = super.getValue(props);
        props = props || this.props;
        if (props.multi) {
            return Array.isArray(value) ? value : [];
        } else {
            return [value || {}];
        }
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            listItems: this.getValue(nextProps),
            dragIndex: -1,
            willDrop: false,
            dropIndex: -1,
        });
    }

    handleChange(index, value) {
        const listItems = this.state.listItems.slice();
        listItems[index] = value;
        if (typeof this.props.onChange === "function") {
            this.props.onChange(this.props.fieldName, this.props.multi ? listItems : value);
        }
    }

    handleCreate = (e, index) => {
        const item = this.getValue().slice();
        const newItem = {};
        const baseField = this.props.field;
        for (const fieldName of Object.keys(baseField.props)) {
            const propDesc = baseField.props[fieldName];
            if (propDesc.default != null) {
                let defaultValue = propDesc.default;
                if (propDesc.type === "string") {
                    defaultValue = template.render(defaultValue, { $i18n: i18n.getForStore(this.props.storeName) });
                }

                newItem[fieldName] = defaultValue;
            } else if (fieldName === "_id" && propDesc.type !== "ref") {
                newItem[fieldName] = uuid.v4();
            }
        }

        if (index >= 0) {
            item.splice(index + 1, 0, newItem);
        } else {
            item.push(newItem);
        }
        if (typeof this.props.onChange === "function") {
            this.props.onChange(this.props.fieldName, item);
        }

        e.preventDefault();
    };

    handleDelete(index, e) {
        const item = this.getValue().slice();
        item.splice(index, 1);
        if (typeof this.props.onChange === "function") {
            this.props.onChange(this.props.fieldName, item);
        }

        e.preventDefault();
    }

    handleDragStart(e) {
        const index = e.currentTarget.getAttribute("data-index") * 1;
        const item = e.currentTarget.parentElement;
        item.classList.add("drag");
        this.setState({
            dragIndex: index,
            dragHeight: item.offsetHeight,
            startX: e.pageX,
            startY: e.pageY,
            offsetX: item.offsetLeft,
            offsetY: item.offsetTop,
            dragX: item.offsetLeft,
            dragY: item.offsetTop,
        });
    }

    handleDragEnd(e) {
        if (this.state.dragIndex >= 0) {
            this.setState({
                dragIndex: -1,
                willDrop: false,
                dropIndex: -1,
            });
        }
    }

    handleDrag(e) {
        if (this.state.dragIndex >= 0 && !this.state.willDrop) {
            e.preventDefault();
            e.stopPropagation();
            let x = this.state.offsetX + (e.pageX - this.state.startX),
                y = this.state.offsetY + (e.pageY - this.state.startY);
            this.setState({ dragX: x + "px", dragY: y + "px" });
        }
    }

    handleDragEnter(index, e) {
        if (this.state.dragIndex >= 0) {
            if (this.state.dragIndex != index && this.state.dragIndex != index - 1) {
                this.setState({ dropIndex: index });
            }
        }
    }

    handleDragLeave(index, e) {
        if (this.state.dragIndex >= 0) {
            this.setState({ dropIndex: -1 });
        }
    }

    handleDrop(e) {
        if (this.state.dragIndex >= 0 && this.state.dropIndex >= 0) {
            e.preventDefault();
            e.stopPropagation();
            const from = this.state.dragIndex;
            let to = this.state.dropIndex;

            let offsetY = this.refs["drop" + this.state.dropIndex].offsetTop + 14;

            if (to > from) {
                //Setting magic number - 6, is more simple than search where it from
                offsetY = offsetY - this.state.dragHeight - 6;
                to--;
            }

            const timer = setTimeout(() => {
                let items = this.state.listItems.slice();
                items.splice(to, 0, items.splice(from, 1)[0]);
                if (typeof this.props.onChange === "function") {
                    this.props.onChange(this.props.fieldName, items);
                }
            }, 250);
            this.setState({ willDrop: true, dragY: offsetY + "px", timer: timer });
        }
    }

    render() {
        const baseItem = this.props.item;
        const baseField = this.props.field;
        const user = this.props.user;
        if (baseField.display === "none") {
            return null;
        }

        const access = baseField.groupAccess + (this.props.user._id === baseItem._ownerId ? baseField.ownerAccess : "");
        const labelText = baseField.label({ $i18n: i18n.getForStore(this.props.storeName) });
        const addLabel = template.render(baseField.singularLocal || baseField.addLabel || "", {
            $i18n: i18n.getForStore(this.props.storeName),
        });

        const disabled =
            baseField.disabled(this.props.user, this.props.combinedItem, baseItem) ||
            this.props.readOnly ||
            access.indexOf("u") < 0;

        const disableActions = !this.props.multi || disabled;
        const disableAdding = this.props.maxLength && this.state.listItems.length >= this.props.maxLength.getValue();
        const disableDelete =
            (this.props.minLength && this.state.listItems.length <= this.props.minLength.getValue()) ||
            (this.props.required && this.props.required.getValue() && this.state.listItems.length === 1);
        const disableDrag = !baseField.sortable || disableActions || this.state.listItems.length < 2;

        const innerStoreDesc = this.props.field;
        const storeDesc = configStore.getConfig(this.props.storeName);
        if (storeDesc != null) {
            innerStoreDesc.formGroups = storeDesc.formGroups;
        }

        const liControls = this.state.listItems.map((item, index) => {
            const invalidObjects = find.item(baseItem.$invalidProps, validityErrors.INNER_ERROR, "type") || [];
            const drag = this.state.dragIndex === index;
            const style = {};
            if (drag) {
                style.left = this.state.dragX;
                style.top = this.state.dragY;
            }

            return (
                <div
                    className={
                        "list-item-wrapper relative" +
                        (drag ? " drag" : "") +
                        (index === 0 ? " first" : "") +
                        (this.state.willDrop ? " wd" : "")
                    }
                    style={style}
                    key={"object-li-" + (item._id || index)}
                >
                    {!disableDrag && (
                        <div
                            className="drag-handle"
                            style={{ display: this.state.dragIndex === index ? "block !important" : "" }}
                            onMouseDown={this.handleDragStart}
                            data-index={index}
                        >
                            <i className="material-icons">drag_handle</i>
                        </div>
                    )}
                    <ObjectInput
                        item={item}
                        key={item._id || index}
                        baseItem={baseItem}
                        combinedBaseItem={this.props.combinedItem}
                        storeDesc={innerStoreDesc}
                        storeName={this.props.storeName}
                        disabled={disabled}
                        disableAdding={disableActions || disableAdding || !access.includes("c")}
                        disableDelete={disableDelete || disableActions || !access.includes("d")}
                        onDelete={this.handleDelete.bind(this, index)}
                        onChange={this.handleChange.bind(this, index)}
                        invalidProps={invalidObjects[index]}
                        noUpdate={this.state.dragIndex >= 0}
                        className={index === 0 ? "first" : ""}
                        index={index}
                        performAction={this.props.performAction}
                        handleCreate={this.handleCreate}
                        user={user}
                    />
                </div>
            );
        });

        if (this.state.dragIndex >= 0) {
            for (let i = liControls.length; i >= 0; i--) {
                const drop = this.state.dropIndex === i;
                const style = {};
                if (this.state.dragIndex === i && !this.state.willDrop) {
                    style.height = 20 + this.state.dragHeight + "px";
                }

                if (drop) {
                    style.height = this.state.dragHeight + 14 + "px";
                }

                liControls.splice(
                    i,
                    0,
                    <div
                        className={"list-item-divider" + (drop ? " drop" : "")}
                        key={"div-li-" + i}
                        onMouseEnter={this.handleDragEnter.bind(this, i)}
                        onMouseLeave={this.handleDragLeave.bind(this, i)}
                        ref={"drop" + i}
                        onMouseUp={this.handleDrop}
                        style={style}
                    />,
                );
            }
        }
        return (
            <div
                className={"form-field object-input relative" + (this.state.dragIndex >= 0 ? " drag" : "")}
                style={this.props.field.style}
                onMouseMove={this.handleDrag}
                onMouseLeave={this.handleDragEnd}
                onMouseUp={this.handleDragEnd}
            >
                <SimpleLabel
                    text={labelText}
                    changed={this.isChanged()}
                    tooltip={this.props.field.tooltip}
                    storeName={this.props.storeName}
                    className={this.props.field.labelClassName}
                />
                <div className="list-items">{liControls}</div>
                {disableActions || disableAdding || !access.includes("c") ? null : (
                    <button
                        type="button"
                        onClick={this.handleCreate}
                        className="btn-flat first"
                        style={{ display: "flex", alignItems: "center" }}
                    >
                        <i className="material-icons text">add</i>
                        &#160; <span>{addLabel || i18n.get("form.addToObjectList")}</span>
                    </button>
                )}
            </div>
        );
    }
}

ObjectList.propTypes = {
    fieldName: PropTypes.string.isRequired,
    field: PropTypes.object.isRequired,
    item: PropTypes.object,
    onChange: PropTypes.func.isRequired,
};
ObjectList.defaultProps = {};

export default ObjectList;
