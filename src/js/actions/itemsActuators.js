/**
 * Created by kib357 on 18/11/15.
 */

import dispatcher from "../dispatcher/blankDispatcher";
import appState from "../stores/appStateStore";
import { userActions, serverActions } from "constants";
import historyActions from "../actions/historyActuators";
import client from "../wamp/client";
import alerts from "../utils/alertsEmitter";
import i18n from "../stores/i18nStore";
import changesProcessor from "../utils/changesProcessor";

class itemActuators {
    loadItems(offset) {
        dispatcher.dispatch({
            actionType: userActions.LOAD_ITEMS,
            offset: offset,
        });
    }

    create(storeName, data) {
        dispatcher.dispatch({
            actionType: userActions.ITEM_CREATE,
            storeName: storeName || appState.getCurrentStore(),
            data,
        });
    }

    select(itemId) {
        historyActions.goToStoreItem(appState.getCurrentStore(), itemId);
    }

    saveDraft(item, storeName) {
        if (item == null) {
            throw new Error("Cannot save draft - item is null or undefined");
        }

        dispatcher.dispatch({
            actionType: userActions.ITEM_SAVE_DRAFT,
            item: item,
            storeName: storeName || appState.getCurrentStore(),
        });
    }

    save(item) {
        dispatcher.dispatch({
            actionType: userActions.ITEM_SAVE_REQUEST,
            itemId: item._id,
        });
    }

    saveToServer(item, storeName, cb) {
        const data = Object.assign({}, item, item.$changedProps);
        delete data.$state;
        delete data.$changedProps;
        delete data.$part;
        client.call(`com.stores.${storeName || appState.getCurrentStore()}.save`, data, (error, data) => {
            if (error != null) {
                alerts.error(i18n.get("errors.save") + " " + item.name + ": " + error.desc);
                if (typeof cb === "function") {
                    cb(error, data);
                }
            }
        });
    }

    delete(item, storeName) {
        dispatcher.dispatch({
            actionType: userActions.ITEM_DELETE_REQUEST,
            item: item,
            storeName: storeName || appState.getCurrentStore(),
        });
    }

    performAction(item, actionId, data, storeName) {
        dispatcher.dispatch({
            actionType: userActions.ITEM_ACTION_REQUEST,
            item: item,
            actionId: actionId,
            data: data,
            storeName: storeName || appState.getCurrentStore(),
        });
    }

    performStoreAction(storeName, actionId, requestData) {
        changesProcessor.combineItem(requestData);
        storeName = storeName || appState.getCurrentStore();
        dispatcher.dispatch({
            actionType: userActions.STORE_ACTION_REQUEST,
            actionId: actionId,
            storeName: storeName,
        });
        client.call("com.action", storeName, actionId, "", requestData || {}, function (error, data) {
            dispatcher.dispatch({
                actionType: serverActions.STORE_ACTION_RESPONSE,
                actionId: actionId,
                storeName: storeName,
                error: error,
            });
            if (error != null) {
                alerts.error(i18n.get("errors.action") + ": " + error.desc, 5);
            }
        });
    }

    loadRefs(itemId, property, all, query, storeName) {
        return new Promise((resolve, reject) => {
            client.call(
                `com.stores.${storeName || appState.getCurrentStore()}.load-refs`,
                itemId,
                property,
                all,
                query,
                (err, res) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve(res);
                }
            );
        });
    }

    addComment(itemId, fieldName, comment, storeName) {
        return new Promise((resolve, reject) => {
            client.call(
                `com.stores.${storeName || appState.getCurrentStore()}.push`,
                itemId,
                fieldName,
                comment,
                (error, res) => {
                    if (error == null) {
                        resolve(res);
                    } else {
                        reject(error);
                    }
                }
            );
        });
    }
}

const actions = new itemActuators();

export default actions;