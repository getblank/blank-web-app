/**
 * Created by kib357 on 17/05/15.
 */
import dispatcher from "../dispatcher/blankDispatcher";
import client from "../wamp/client";
import alerts from "../utils/alertsEmitter";
import i18n from "../stores/i18nStore";
import find from "utils/find";
import {serverActions} from "constants";

var updateUserData = function (data) {
    dispatcher.dispatch({
        "actionType": serverActions.UPDATE_USER,
        "user": data.user,
    });
};

module.exports = {
    subscribe: function (user) {
        console.log("Subscribe action for user credentials");
        client.subscribe("com.user", updateUserData, updateUserData, (error) => {
            alerts.error(i18n.getError(error));
        });
    },
    unsubscribe: function () {
        console.log("Unsubscribe action for user credentials");
        client.unsubscribe("com.user");
    },
    setUser: function (user) {
        dispatcher.dispatch({
            "actionType": serverActions.SIGN_IN,
            "user": user,
        });
    },
    signIn: function ({login, password}) {
        return client.signIn(login, password)
            .then(data => {
                dispatcher.dispatch({
                    "actionType": serverActions.SIGN_IN,
                    "user": data,
                    "error": null,
                });
            })
            .catch(_err => {
                const err = _err.message;
                console.log("SIGNIN ERR:", err);
                dispatcher.dispatch({
                    "actionType": serverActions.SIGN_IN,
                    "user": null,
                    "error": err,
                });
                switch (err) {
                    case "User not found":
                    case "Password not match":
                        alerts.error(i18n.get("signIn.error"), 2);
                        break;
                    default:
                        alerts.error(i18n.getError(err));
                        break;
                }
                throw _err;
            });
    },
    signOut: function () {
        return client.signOut()
        .then(data => {
            dispatcher.dispatch({
                "actionType": serverActions.SIGN_OUT,
                "state": "RESULT",
                "rawMessage": data,
            });
        })
        .catch(err => {
            dispatcher.dispatch({
                "actionType": serverActions.SIGN_OUT,
                "state": "ERROR",
                "error": err,
            });
        });
    },
    signUp: function (data, successText) {
        let redirectUrl = location.search.match(/redirectUrl=([^&]*)&?/);
        if (redirectUrl) {
            data.redirectUrl = decodeURIComponent(redirectUrl[1]);
        }
        return new Promise((resolve, reject) => {
            client.call("com.sign-up", data,
                (error, data) => {
                    if (error == null) {
                        alerts.info(successText, 15);
                        if (data && data.user) {
                            dispatcher.dispatch({
                                "actionType": serverActions.SIGN_IN,
                                "rawMessage": data,
                            });
                        } else {
                            window.location.hash = "#";
                        }
                    }
                    else {
                        switch (error.desc) {
                            case "USER_EXISTS":
                                alerts.error(i18n.get("registration.emailError"), 2);
                                break;
                            case "WRONG_EMAIL":
                            case "WRONG_LOGIN":
                            case "NO_LOGIN_AND_EMAIL":
                            case "WRONG_PASSWORD":
                            default:
                                alerts.error(i18n.getError(error));
                                break;
                        }
                    }
                    resolve();
                });
        });
    },
    sendResetLink: function (mail) {
        return new Promise((resolve, reject) => {
            client.call("com.send-reset-link",
                mail,
                (error, data) => {
                    if (error == null) {
                        alerts.info(i18n.get("signIn.restoreLinkSent"), 5);
                        window.location.hash = "#";
                    }
                    else {
                        alerts.error(i18n.getError(error));
                    }
                    resolve();
                });
        });
    },
    resetPassword: function (data) {
        data.token = find.urlParam("token");
        return new Promise((resolve, reject) => {
            client.call("com.reset-password",
                data,
                (error, data) => {
                    if (error == null) {
                        alerts.info(i18n.get("profile.passwordSaved"), 5);
                        setTimeout(() => {
                            window.location = location.protocol + "//" + location.host + location.pathname;
                        }, 3000);
                    }
                    else {
                        alerts.error(i18n.getError(error));
                    }
                    resolve();
                });
        });
    },
    checkUser: function (value) {
        return new Promise((resolve, reject) => {
            client.call("com.check-user",
                value,
                (error, data) => {
                    if (error == null) {
                        resolve(data);
                    }
                    else {
                        alerts.error(i18n.getError(error));
                        reject(error);
                    }
                });
        });
    },
};