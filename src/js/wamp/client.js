/**
 * Created by kib357 on 21/02/15.
 */

import connectionActions from "../actions/connectionActuator.js";
import credentialsStore from "../stores/credentialsStore.js";
import WampClient from "wamp";

let wampClient = {
    close: () => { },
    subscribe: () => { },
    unsubscribe: () => { },
};

let connect = function () {
    if (wampClient) {
        wampClient.close();
    }
    let accessToken = credentialsStore.getApiKey();
    let suffix = accessToken ? "?access_token=" + encodeURIComponent(accessToken) : "";
    let wsUrl = (process.env.WS || ((location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/")) + "wamp" + suffix;
    wampClient = new WampClient(true, true);
    wampClient.onopen = function () {
        console.info("connected to " + wsUrl);
        connectionActions.connected();
    };
    wampClient.onclose = function () {
        connectionActions.disconnected();
    };

    wampClient.open(wsUrl);
};

window.addEventListener("beforeunload", function () {
    wampClient.close(null, false);
});

var callViaXhr = function (uri, cb) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                let response = null;
                try {
                    response = JSON.parse(xhr.responseText);
                } catch (e) {
                    cb(null, e);
                    return;
                }
                cb(response, null);
            } else {
                cb(null, { "status": xhr.status, "statusText": xhr.statusText });
            }
        }
    };
    xhr.open("GET", uri);
    xhr.send();
};

var callViaFetch = function (args, callback) {
    let uri = `${location.protocol}//${location.host}/${args.uri}`;
    delete args.uri;
    args.method = args.method || "GET";
    fetch(uri, args)
        .then(res => {
            if (res.status === 200 || res.status === 201) {
                return res.json();
            }
            throw new Error(res.statusText);
        })
        .then(res => { callback(null, res) })
        .catch(callback);
};

var call = function (uri, callback) {
    if (uri.uri) {
        callViaFetch(uri, callback);
    } else if (uri.indexOf("xhr.") === 0) {
        callViaXhr("/" + uri.slice(4), callback);
    } else {
        wampClient.call.apply(null, arguments);
    }
};

export default {
    subscribe: function () {
        return wampClient.subscribe.apply(wampClient, arguments);
    },
    unSubscribe: function () {
        return wampClient.unsubscribe.apply(wampClient, arguments);
    },
    call: call,
    connect: connect,
};