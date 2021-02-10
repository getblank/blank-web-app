/**
 * Created by kib357 on 07/10/15.
 */

import React from "react";
import modifiedItems from "../../stores/modifiedItemsStore.js";
import appState from "../../stores/appStateStore.js";
import i18n from "../../stores/i18nStore.js";
import configStore from "../../stores/configStore.js";
import alerts from "../../utils/alertsEmitter.js";
import { systemStores } from "constants";
import { storeEvents, itemStates } from "constants";

class ChangesTracker extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            modified: new Map(),
        };
        this._onChange = this._onChange.bind(this);
    }

    componentDidMount() {
        appState.on(storeEvents.CHANGED, this._onChange);
        modifiedItems.on(storeEvents.CHANGED, this._onChange);
        this._onChange();
    }

    componentWillUnmount() {
        appState.removeListener(storeEvents.CHANGED, this._onChange);
        modifiedItems.removeListener(storeEvents.CHANGED, this._onChange);
        for (let [key, entry] of this.state.modified.entries()) {
            alerts.removeNotification(key);
        }
    }

    _onChange() {
        const newModified = new Map();
        const oldModified = this.state.modified;
        const { entries } = configStore.getConfig(systemStores.settings);
        const { notificationNotSavedHideIn = -1 } = entries;

        for (const item of modifiedItems.getAll()) {
            if (
                item._id === appState.getCurrentItemId() ||
                item.$state === itemStates.saving ||
                item.$state === itemStates.moved ||
                item.$state === itemStates.deleting ||
                item.$state === itemStates.deleted
            ) {
                continue;
            }
            newModified.set(item._id, item);
            if (!oldModified.has(item._id)) {
                const name = configStore.getItemName(item, item.$store);
                alerts.notification(
                    {
                        _id: item._id,
                        message: i18n.get("form.notSaved"),
                        icon: "warning",
                        notOpenNC: true,
                        relatedObjects: [
                            {
                                name: name,
                                _id: item._id,
                                mode: "link",
                                store: item.$store,
                            },
                        ],
                    },
                    notificationNotSavedHideIn,
                );
            }
            oldModified.delete(item._id);
        }
        for (const id of oldModified.keys()) {
            alerts.removeNotification(id);
        }
        this.setState({ modified: newModified });
    }

    render() {
        return null;
    }
}

ChangesTracker.propTypes = {};
ChangesTracker.defaultProps = {};

export default ChangesTracker;
