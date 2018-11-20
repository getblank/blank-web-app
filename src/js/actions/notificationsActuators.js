/**
 * Created by kib357 on 30/08/15.
 */

import dispatcher from "../dispatcher/blankDispatcher";
import client from "../wamp/client";
import alerts from "../utils/alertsEmitter";
import { serverActions, userActions } from "constants";

let pathPrefix = "";
const matched = window.location.pathname.match(/(.*)\/app\//);
if (matched) {
    pathPrefix = matched[1];
}

const notificationsUpdate = function(storeName, { event, data }) {
    let statusText;
    if (event === "delete") {
        return dispatcher.dispatch({
            actionType: serverActions.NOTIFICATIONS_UPDATE,
            rawMessage: { event, data, group: storeName },
        });
    }

    fetch(`${pathPrefix}/api/v1/${storeName}/${data[0]._id}`, { credentials: "include" })
        .then(res => {
            if (res.status === 403 || res.status === 404) return;
            if (res.status !== 200) {
                statusText = res.statusText;
            }
            return res.json();
        })
        .then(item => {
            if (statusText) {
                throw new Error(item || statusText);
            }

            if (item) {
                dispatcher.dispatch({
                    actionType: serverActions.NOTIFICATIONS_UPDATE,
                    rawMessage: { event, data: [item], group: storeName },
                });
            }
        })
        .catch(err => {
            console.error("[notificationsActuators:notificationsUpdate]", err);
            alerts.error(err);
        });
};

const exports = {
    subscribe: function(stores) {
        for (let store of stores) {
            client.subscribe(
                "com.stores." + store,
                notificationsUpdate.bind(this, store),
                res => {},
                error => {
                    alerts.error("Ошибка при подписке: " + JSON.stringify(error) + " =(", 5);
                },
            );
        }
    },
    unsafeDelete: function(store, ids) {
        ids = [].concat(ids);
        client.call("com.stores." + store + ".delete", ids);
    },
    delete: function (storeName, id) {
        return fetch(`${pathPrefix}/api/v1/${storeName}/${id}`, {
            credentials: "include",
            method: "DELETE",
        })
            .then(res => {
                if (res.status === 403 || res.status === 404) {
                    return dispatcher.dispatch({
                        actionType: serverActions.NOTIFICATIONS_UPDATE,
                        rawMessage: { event: "delete", data: [id], group: storeName },
                    });
                }
                return;
            })
            .catch(err => {
                console.error("[notificationsActuators:delete]", err);
            });
    },
    performAction: function(storeName, item, actionId, actionData) {
        return new Promise(function(resolve, reject) {
            client.call("com.action", storeName, actionId, item._id, actionData, function(error, data) {
                if (error == null) {
                    resolve(data);
                } else {
                    switch (error.desc) {
                        default:
                            alerts.error("Очень жаль, но мы не смогли выполнить ваш запрос: " + error.desc + " =(", 5);
                            break;
                    }
                    reject(error);
                }
            });
        });
    },
    highlight: function(id) {
        dispatcher.dispatch({
            actionType: userActions.NOTIFICATIONS_HIGHLIGHT,
            id: id,
        });
    },
    find(group) {
        client.call(`com.stores.${group}.find`, { query: {}, take: 300, skip: 0, orderBy: "-createdAt" }, function(
            error,
            data,
        ) {
            if (error == null) {
                dispatcher.dispatch({
                    actionType: serverActions.NOTIFICATIONS_INIT,
                    items: data.items,
                    length: data.count,
                    group: group,
                });
            }
        });
    },
};

export default exports;
