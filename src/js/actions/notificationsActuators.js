/**
 * Created by kib357 on 30/08/15.
 */

import dispatcher from "../dispatcher/blankDispatcher";
import client from "../wamp/client";
import alerts from "../utils/alertsEmitter";
import { serverActions, userActions } from "constants";

var notificationsUpdate = function(store, data) {
    data.group = store;
    dispatcher.dispatch({
        actionType: serverActions.NOTIFICATIONS_UPDATE,
        rawMessage: data,
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
    delete: function(store, id) {
        return new Promise(function(resolve, reject) {
            client.call(`com.stores.${store}.delete`, id, (error, data) => {
                if (error == null) {
                    resolve(data);
                } else {
                    alerts.error("Очень жаль, но мы не смогли выполнить ваш запрос: " + error.desc + " =(", 5);
                    reject(error);
                }
            });
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
