/**
 * Created by kib357 on 09/11/15.
 */

import dispatcher from "../dispatcher/blankDispatcher";
import client from "../wamp/client";
import changesProcessor from "../utils/changesProcessor";
import alerts from "../utils/alertsEmitter";
import i18n from "../stores/i18nStore";
import {serverActions} from "constants";
import uuid from "node-uuid";

let currentFindId = null;

class DataActuators {
    subscribe(storeName, params) {
        client.subscribe("com.stores." + storeName, (data) => {
            dispatcher.dispatch({
                "actionType": serverActions.ITEMS_UPDATED,
                "data": data,
                "storeName": storeName,
            });
        }, () => {
            dispatcher.dispatch({
                "actionType": serverActions.SUBSCRIBED,
                "storeName": storeName,
            });
        }, (error) => {
            alerts.error(i18n.getError(error));
        }, params);
    }

    unsubscribe(storeName) {
        console.log("Unsubscribe action for " + storeName);
        client.unSubscribe("com.stores." + storeName);
    }

    find(storeName, query, take, skip, order, currentId) {
        let id = uuid.v4();
        currentFindId = id;
        client.call(
            `com.stores.${storeName}.find`,
            { "query": query, "take": take, "skip": skip, "orderBy": order || "name", "currentId": currentId },
            function (error, data) {
                if (error == null && currentFindId === id) {
                    dispatcher.dispatch({
                        "actionType": serverActions.ITEMS_PART_LOADED,
                        "items": data.items,
                        "stateCounters": data.stateCounts,
                        "offset": skip,
                        "length": data.count,
                        "currentIndex": data.currentIndex,
                        "currentItem": data.currentItem,
                        "storeName": storeName,
                    });
                }
            });
    }

    load(storeName, id) {
        client.call(
            `com.stores.${storeName}.get`,
            id,
            (error, data) => {
                dispatcher.dispatch({
                    "actionType": serverActions.ITEM_LOAD_2,
                    "error": error,
                    "item": data,
                    "itemId": id,
                });
            });
    }

    save(storeName, item, nameForAlert) {
        let name = (nameForAlert || item.$changedProps.name || item.name || "");

        if (item.$state !== "new") {
            item = { "_id": item._id, "$changedProps": item.$changedProps };
        }
        changesProcessor.combineItem(item);
        console.log("Item to save: ", item);
        client.call(
            `com.stores.${storeName}.save`,
            item,
            (error, data) => {
                dispatcher.dispatch({
                    "actionType": serverActions.ITEM_SAVE_RESPONSE,
                    "error": error,
                    "itemId": item._id,
                });

                let alertText = error != null ? (i18n.get("errors.save") + " " + name + ": " + error.desc) :
                    ((name ? "\"" + name + "\" - " : "") + i18n.get("common.saved"));
                alerts.info(alertText);
            });
    }

    delete(storeName, id) {
        client.call(
            `com.stores.${storeName}.delete`,
            id,
            (error, data) => {
                dispatcher.dispatch({
                    "actionType": serverActions.ITEM_DELETE_RESPONSE,
                    "error": error,
                    "itemId": id,
                });
                if (error != null) {
                    alerts.error(i18n.get("errors.delete") + ": " + error.desc, 5);
                }
            });
    }

    performAction(storeName, itemId, actionId, data) {
        changesProcessor.combineItem(data || {});
        client.call(
            "com.action",
            storeName,
            actionId,
            itemId,
            data || {},
            function (error, data) {
                dispatcher.dispatch({
                    "actionType": serverActions.ITEM_ACTION_RESPONSE,
                    "storeName": storeName,
                    "itemId": itemId,
                    "actionId": actionId,
                    "data": data,
                    "error": error,
                });
                if (error != null) {
                    alerts.error(i18n.get("errors.action") + ": " + error.desc, 5);
                }
            });
    }
}

export default new DataActuators();