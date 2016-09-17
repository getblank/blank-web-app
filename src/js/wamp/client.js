/**
 * Created by kib357 on 21/02/15.
 */

import connectionActions from "../actions/connectionActuator.js";
import credentialsStore from "../stores/credentialsStore.js";
import {WSClient} from "blank-web-sdk";

const clientMock = {
    close: () => { },
    subscribe: () => { },
    unsubscribe: () => { },
};

let wampClient = clientMock;

let connect = function () {
    if (wampClient) {
        wampClient.close();
    }
    let accessToken = credentialsStore.getApiKey();
    let suffix = accessToken ? "?access_token=" + encodeURIComponent(accessToken) : "";
    let wsUrl = (process.env.WS || ((location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/")) + "wamp" + suffix;
    wampClient = new WSClient(true, true);
    wampClient.onopen = function () {
        console.info("connected to " + wsUrl);
        connectionActions.connected();
    };
    wampClient.onclose = function () {
        connectionActions.disconnected();
    };

    wampClient.open(wsUrl);
};

let disconnect = function () {
    if (wampClient) {
        wampClient.close();
    }
    wampClient = clientMock;
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
                    cb(e, null);
                    return;
                }
                cb(null, response);
            } else {
                cb({ "status": xhr.status, "statusText": xhr.statusText }, null);
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

var call = function (uri) {
    let data = Array.prototype.slice.call(arguments, 1);
    let callback = typeof data[data.length - 1] === "function" ? data.pop() : () => {};
    if (uri.uri) {
        callViaFetch(uri, callback);
    } else if (uri.indexOf("xhr.") === 0) {
        callViaXhr("/" + uri.slice(4), callback);
    } else {
        wampClient.call.apply(wampClient, arguments);
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
    disconnect: disconnect,
};