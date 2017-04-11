/**
 * Created by kib357 on 16/05/15.
 */

import BaseStore from "./baseStore.js";
import credentialsActions from "../actions/credentialsActuators.js";
import historyActions from "../actions/historyActuators.js";
import { serverActions } from "constants";

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
            signedIn: this._signedIn,
            loading: this._waitingForResponse,
            user: this._user,
            error: this._error,
        };
    }

    getUser() {
        return this._user != null ? Object.assign({}, this._user) : null;
    }

    getApiKey() {
        return localStorage.getItem("blank-access-token");
    }

    signedIn() {
        return this._user != null;
    }

    __clearUserData(notRemoveKey) {
        if (notRemoveKey !== true) {
            localStorage.removeItem("blank-access-token");
        }
        this._waitingForResponse = false;
        this._signedIn = false;
        this._user = null;
    }

    __setUserData(user, update) {
        if (update) {
            this._user = this._user || {};
            Object.assign(this._user, user);
        } else {
            this._user = user;
        }
        this._signedIn = this._user != null;
        let redirectUrl = location.search.match(/redirectUrl=([^&]*)&?/);
        if (redirectUrl) {
            window.location = decodeURIComponent(redirectUrl[1]);
        }
    }

    __onDispatch(payload) {
        this._error = null;
        switch (payload.actionType) {
            case serverActions.DISCONNECTED_EVENT:
                // this.__clearUserData(true);
                // this.__emitChange();
                break;
            case serverActions.UPDATE_USER:
                this.__setUserData(payload.user, true);
                this.__emitChange();
                break;
            case serverActions.SIGN_IN:
                if (payload.error == null) {
                    this.__setUserData(payload.user);
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
                break;
        }
    }
}

var store = new CredentialsStore();
//store.setMaxListeners(30);

export default store;