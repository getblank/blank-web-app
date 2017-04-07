/**
 * Created by kib357 on 25/03/15.
 */

import { serverActions, lsKeys } from "constants";
import alerts from "../utils/alertsEmitter";
import dispatcher from "../dispatcher/blankDispatcher";
import client from "../wamp/client";

var _getBaseConfig = function () {
    var locale = localStorage.getItem(lsKeys.locale);
    fetch(`common-settings${locale ? "?lang=" + locale : ""}`)
        .then(res => {
            return res.json();
        })
        .then(data => {
            dispatcher.dispatch({
                actionType: serverActions.UPDATE_CONFIG,
                data: data,
                user: null,
            });
        })
        .catch(err => {
            alerts.error("Something wrong: " + err);
        });
};

class ConfigActuators {
    subscribe(user) {
        if (user == null) {
            alerts.error("Please provide user to get config for.");
            return;
        }

        const configUpdater = (data) => {
            dispatcher.dispatch({
                action: {},
                actionType: serverActions.UPDATE_CONFIG,
                data: data,
                user: user,
            });
        };
        client.subscribe("com.config", configUpdater, configUpdater);
    }

    unsubscribe() {
        console.log("Unsubscribe action for config");
        client.unsubscribe("com.config");
    }

    getBaseConfig() {
        return _getBaseConfig();
    }

    setLocale(locale) {
        localStorage.setItem(lsKeys.locale, locale);
        _getBaseConfig();
    }
}

export default new ConfigActuators();