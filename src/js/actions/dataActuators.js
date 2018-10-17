/**
 * Created by kib357 on 09/11/15.
 */

import dispatcher from "../dispatcher/blankDispatcher";
import client from "../wamp/client";
import changesProcessor from "../utils/changesProcessor";
import alerts from "../utils/alertsEmitter";
import i18n from "../stores/i18nStore";
import { serverActions } from "constants";

let currentFindId = 0;
let pathPrefix = "";
const matched = window.location.pathname.match(/(.*)\/app\//);
if (matched) {
    pathPrefix = matched[1];
}

class DataActuators {
    subscribe(storeName, params) {
        client.subscribe(
            "com.stores." + storeName,
            data => {
                dispatcher.dispatch({
                    actionType: serverActions.ITEMS_UPDATED,
                    data: data,
                    storeName: storeName,
                });
            },
            () => {
                dispatcher.dispatch({
                    actionType: serverActions.SUBSCRIBED,
                    storeName: storeName,
                });
            },
            error => {
                alerts.error(i18n.getError(error));
            },
            params,
        );
    }

    unsubscribe(storeName) {
        console.log("Unsubscribe action for " + storeName);
        client.unsubscribe("com.stores." + storeName);
    }

    find(storeName, query, take, skip, orderBy, currentId) {
        const id = ++currentFindId;
        const uri = `query=${JSON.stringify(query)}&take=${take}&skip=${skip}&orderBy=${orderBy}`;
        const uriString = encodeURI(uri);
        let needToThrowError = false;
        fetch(`${pathPrefix}/api/v1/${storeName}?${uriString}`, { credentials: "include" })
            .then(res => {
                if (res.status !== 200) {
                    if (res.status === 403) {
                        // Just check if session is valid
                        client.getTokenInfo();
                    }

                    if (res.status === 303 && res.headers.get("Content-Type").includes("json")) {
                        needToThrowError = true;
                        return res.json();
                    }

                    throw new Error(res.statusText);
                }

                return res.json();
            })
            .then(data => {
                if (needToThrowError) {
                    throw new Error(data);
                }

                if (currentFindId === id) {
                    dispatcher.dispatch({
                        actionType: serverActions.ITEMS_PART_LOADED,
                        items: data.items,
                        stateCounters: data.stateCounts,
                        offset: skip,
                        length: data.count,
                        currentIndex: data.currentIndex,
                        currentItem: data.currentItem,
                        storeName: storeName,
                    });
                }
            })
            .catch(err => {
                console.error("Error on find", err);
                alerts.error(err);
                dispatcher.dispatch({
                    actionType: serverActions.ITEMS_PART_LOADED,
                    items: [],
                    offset: skip,
                    length: 0,
                    storeName: storeName,
                });
            });
    }

    findAndReturn(storeName, query, take, skip, orderBy) {
        const uri = `query=${JSON.stringify(query)}&take=${take}&skip=${skip}&orderBy=${orderBy}`;
        const uriString = encodeURI(uri);
        return fetch(`${pathPrefix}/api/v1/${storeName}?${uriString}`, { credentials: "include" }).then(res => {
            if (res.status !== 200) {
                throw new Error(res.statusText);
            }

            return res.json();
        });
    }

    async load(storeName, id, __v) {
        const q = __v != null ? `?__v=${__v}` : "";
        let err, item;
        try {
            const resp = await fetch(`${pathPrefix}/api/v1/${storeName}/${id}${q}`, { credentials: "include" });
            if (resp.status !== 200) {
                err = new Error(resp.statusText);
                return;
            }

            item = await resp.json();
        } catch (error) {
            err = error;
        } finally {
            dispatcher.dispatch({
                actionType: serverActions.ITEM_LOAD_2,
                error: err,
                itemId: id,
                item,
            });
        }
    }

    save(storeName, item, nameForAlert) {
        const name = nameForAlert || item.$changedProps.name || item.name || "";
        const newItem = item._id === `${storeName}-new`;
        if (!newItem) {
            item = { _id: item._id, $changedProps: item.$changedProps };
        }

        changesProcessor.combineItem(item);
        client.call(`com.stores.${storeName}.${newItem ? "insert" : "save"}`, item, (error, data) => {
            dispatcher.dispatch({
                storeName,
                actionType: newItem ? serverActions.ITEM_INSERT_RESPONSE : serverActions.ITEM_SAVE_RESPONSE,
                error: error,
                itemId: item._id,
                item: data,
            });

            const alertText =
                error != null
                    ? i18n.get("errors.save") + " " + name + ": " + error.desc
                    : (name ? '"' + name + '" - ' : "") + i18n.get("common.saved");

            alerts.info(alertText);
        });
    }

    /**
     * Just dispatch delete event
     * @param {*} storeName
     * @param {*} id
     */
    remove(storeName, id) {
        dispatcher.dispatch({
            actionType: serverActions.ITEM_DELETE_RESPONSE,
            itemId: id,
        });
    }

    delete(storeName, id) {
        client.call(`com.stores.${storeName}.delete`, id, (error, data) => {
            dispatcher.dispatch({
                actionType: serverActions.ITEM_DELETE_RESPONSE,
                error: error,
                itemId: id,
            });
            if (error != null) {
                alerts.error(i18n.get("errors.delete") + ": " + error.desc, 5);
            }
        });
    }

    performAction(storeName, itemId, actionId, data) {
        changesProcessor.combineItem(data || {});
        client.call("com.action", storeName, actionId, itemId, data || {}, function(error, data) {
            dispatcher.dispatch({
                actionType: serverActions.ITEM_ACTION_RESPONSE,
                storeName: storeName,
                itemId: itemId,
                actionId: actionId,
                data: data,
                error: error,
            });
            if (error != null) {
                alerts.error(i18n.get("errors.action") + ": " + error.desc, 5);
            }
        });
    }
}

export default new DataActuators();
