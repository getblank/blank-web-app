/**
 * Created by kib357 on 16/05/15.
 */

import BaseStore from "./baseStore.js";
import credentialsActions from "../actions/credentialsActuators.js";
import historyActions from "../actions/historyActuators.js";
import { serverActions } from "constants";
import client from "../wamp/client";
import find from "utils/find";

class CredentialsStore extends BaseStore {
    constructor(props) {
        super(props);
        this._signedIn = false;
        this._waitingForResponse = false;
        this._user = null;
        this._error = null;
        this._pendingAutoSignIn = true;
    }

    getState() {
        return {
            "signedIn": this._signedIn,
            "loading": this._waitingForResponse,
            "user": this._user,
            "error": this._error,
        };
    }

    getUser() {
        return this._user != null ? Object.assign({}, this._user) : null;
    }

    getApiKey() {
        return localStorage.getItem("access_token");
    }

    signedIn() {
        return this._user != null;
    }

    __clearUserData(notRemoveKey) {
        if (notRemoveKey !== true) {
            localStorage.removeItem("access_token");
        }
        this._waitingForResponse = false;
        this._signedIn = false;
        this._user = null;
    }

    __setUserData(data, update) {
        if (update) {
            Object.assign(this._user, data.user);
        } else {
            this._user = data.user;
        }
        this._signedIn = this._user != null;
        if (data.key) {
            localStorage.setItem("access_token", data.key);
        }
        let redirectUrl = location.search.match(/redirectUrl=([^&]*)&?/);
        if (redirectUrl) {
            window.location = decodeURIComponent(redirectUrl[1]);
        }
    }

    __autoSignIn() {
        console.log("AUTO SIGN IN");
        this._pendingAutoSignIn = false;
        let urlKey = find.urlParam("access_token");
        if (urlKey) {
            localStorage.setItem("access_token", urlKey);
            window.location = location.protocol + "//" + location.host + location.pathname;
            return;
        }
        let key = localStorage.getItem("access_token");
        if (key) {
            try {
                let base64Data = key.split(".")[1];
                let stringData = atob(base64Data);
                let data = JSON.parse(stringData);
                this.__setUserData({ user: { "_id": data.userId }, key: key });
                client.connect();
            } catch (e) {
                console.error("Error while auto sign-in:", e);
            }
        }
    }

    __onDispatch(payload) {
        this._error = null;
        switch (payload.actionType) {
            case serverActions.DISCONNECTED_EVENT:
                this.__clearUserData(true);
                this.__emitChange();
                break;
            case serverActions.UPDATE_USER:
                this.__setUserData(payload.rawMessage, true);
                this.__emitChange();
                break;
            case serverActions.SIGN_IN:
                if (payload.error == null) {
                    console.log("serverActions.SIGN_IN");
                    this.__setUserData(payload);
                    client.connect();
                }
                this.__emitChange();
                break;
            case serverActions.CONNECTED_EVENT:
                credentialsActions.subscribe(this._user);
                this.__emitChange();
                break;
            case serverActions.SIGN_OUT:
                if (this._signedIn) {
                    this.__clearUserData();
                    historyActions.pushState("/");
                    this.__emitChange();
                }
                client.disconnect();
                break;
            case serverActions.UPDATE_CONFIG:
                if (this._pendingAutoSignIn) {
                    this.__autoSignIn();
                }
                break;
        }
    }
}

var store = new CredentialsStore();
//store.setMaxListeners(30);

export default store;