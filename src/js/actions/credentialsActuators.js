/**
 * Created by kib357 on 17/05/15.
 */
import dispatcher from "../dispatcher/blankDispatcher";
import client from "../wamp/client";
import alerts from "../utils/alertsEmitter";
import i18n from "../stores/i18nStore";
import find from "utils/find";
import { serverActions } from "constants";

var updateUserData = function (data) {
    dispatcher.dispatch({
        actionType: serverActions.UPDATE_USER,
        user: data.user,
    });
};

module.exports = {
    updateUserData,
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
            actionType: serverActions.SIGN_IN,
            user: user,
        });
    },
    signIn: function ({ login, password }) {
        return client.signIn(login, password)
            .then(data => {
                dispatcher.dispatch({
                    actionType: serverActions.SIGN_IN,
                    user: data,
                    error: null,
                });
            })
            .catch(_err => {
                const err = _err.message;
                console.log("SIGNIN ERR:", err);
                dispatcher.dispatch({
                    actionType: serverActions.SIGN_IN,
                    user: null,
                    error: err,
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
    clearUserData: function () {
        dispatcher.dispatch({
            actionType: serverActions.SIGN_OUT,
        });
    },
    signOut: function () {
        return client.signOut()
            .then(data => {
                dispatcher.dispatch({
                    actionType: serverActions.SIGN_OUT,
                    state: "RESULT",
                    rawMessage: data,
                });
            })
            .catch(err => {
                dispatcher.dispatch({
                    actionType: serverActions.SIGN_OUT,
                    state: "ERROR",
                    error: err,
                });
            });
    },
    signUp: function (data, successText) {
        const redirectUrl = location.search.match(/redirectUrl=([^&]*)&?/);
        if (redirectUrl) {
            data.redirectUrl = decodeURIComponent(redirectUrl[1]);
        }

        const formData = new FormData();
        for (let key of Object.keys(data)) {
            formData.append(key, data[key]);
        }

        let req = {
            method: "POST",
            timeout: 5000,
            body: formData,
            credentials: "include",
        };
        let status;
        return fetch("register", req)
            .then(res => {
                status = res.status;
                return res.json();
            })
            .then(data => {
                if (status === 200) {
                    alerts.info(successText, 15);
                    if (data && data.user) {
                        dispatcher.dispatch({
                            actionType: serverActions.SIGN_IN,
                            rawMessage: data,
                        });
                    } else {
                        window.location.hash = "#";
                    }
                } else {
                    switch (data) {
                        case "USER_EXISTS":
                            alerts.error(i18n.get("registration.emailError"), 2);
                            break;
                        case "WRONG_EMAIL":
                        case "WRONG_LOGIN":
                        case "NO_LOGIN_AND_EMAIL":
                        case "WRONG_PASSWORD":
                        default:
                            alerts.error(i18n.getError(data));
                            break;
                    }
                }
                return;
            })
            .catch(e => {
                console.error("[singUp error]", e);
            });
    },
    sendResetLink: function (mail) {
        let formData = new FormData();
        formData.append("email", mail.email);
        let req = {
            method: "POST",
            timeout: 5000,
            body: formData,
        };
        let status;
        return fetch("send-reset-link", req)
            .then(res => {
                status = res.status;
                return res.json();
            })
            .then(res => {
                if (status === 200) {
                    alerts.info(i18n.get("signIn.restoreLinkSent"), 5);
                    window.location.hash = "#";
                } else {
                    alerts.error(i18n.getError(res));
                }
            })
            .catch(e => {
                console.error("[sendResetLink]", e);
            });
    },
    resetPassword: function (data) {
        let formData = new FormData();
        formData.append("token", find.urlParam("token"));
        formData.append("password", data.password);
        let req = {
            method: "POST",
            timeout: 5000,
            body: formData,
        };
        let status;
        return fetch("reset-password", req)
            .then(res => {
                status = res.status;
                return res.json();
            })
            .then(res => {
                if (status === 200) {
                    alerts.info(i18n.get("profile.passwordSaved"), 5);
                    setTimeout(() => {
                        window.location = location.protocol + "//" + location.host + location.pathname;
                    }, 3000);
                } else {
                    alerts.error(i18n.getError(res));
                }
            })
            .catch(e => {
                console.error("[resetPassword]", e);
            });
    },
    checkUser: function (value) {
        let formData = new FormData();
        formData.append("email", value);
        let req = {
            method: "POST",
            timeout: 5000,
            body: formData,
        };
        return fetch("check-user", req)
            .then(res => {
                return res.json();
            })
            .then(res => {
                return res;
            })
            .catch(e => {
                console.error("[CheckUser error]", e);
            });
    },
};