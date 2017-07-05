/**
 * Created by kib357 on 21/02/15.
 */
import connectionActions from "../actions/connectionActuator.js";
import credentialsActions from "../actions/credentialsActuators.js";
import { BlankClient } from "blank-web-sdk";


let prefix = "";
const matched = window.location.pathname.match(/(.*)\/app\//);
if (matched) {
    prefix = matched[1];
}

const uri = location.protocol + "//" + location.host + (prefix ? prefix + "/" : "");
const client = new BlankClient(uri);
client.init()
    .then(() => {
        console.log("BlankClient initialized!");
        let tokenInfo = client.getTokenInfo();
        if (tokenInfo) {
            credentialsActions.setUser({ _id: tokenInfo.userId });
        }
        client.on("change", (state, prevState) => {
            switch (state) {
                case "wsConnecting": {
                    connectionActions.disconnected();
                    const info = client.getTokenInfo();
                    credentialsActions.updateUserData({ _id: info.userId });
                    break;
                }
                case "wsConnected":
                    connectionActions.connected();
                    break;
                case "unauthorized":
                    if (state !== prevState) {
                        connectionActions.disconnected();
                        credentialsActions.clearUserData();
                    }
                    break;
                default:
                    connectionActions.disconnected();
                    break;
            }
        });
    });

// window.addEventListener("beforeunload", function () {
//     wampClient.close(null, false);
// });

// var callViaFetch = function (args, callback) {
//     let uri = `${location.protocol}//${location.host + location.pathname + args.uri}`;
//     delete args.uri;
//     args.method = args.method || "GET";
//     fetch(uri, args)
//         .then(res => {
//             if (res.status === 200 || res.status === 201) {
//                 return res.json();
//             }
//             throw new Error(res.statusText);
//         })
//         .then(res => { callback(null, res) })
//         .catch(callback);
// };

// var call = function (uri) {
//     let data = Array.prototype.slice.call(arguments, 1);
//     let callback = typeof data[data.length - 1] === "function" ? data.pop() : () => { };
//     if (uri.uri) {
//         callViaFetch(uri, callback);
//     } else {
//         client.call.apply(wampClient, arguments);
//     }
// };

export default client;