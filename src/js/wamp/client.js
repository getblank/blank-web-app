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
        return client.getTokenInfo()
            .then(tokenInfo => {
                if (tokenInfo) {
                    credentialsActions.setUser({ _id: tokenInfo._id });
                }

                client.on("change", (state, prevState) => {
                    switch (state) {
                        case "wsConnecting": {
                            connectionActions.disconnected();
                            client.getTokenInfo()
                                .then(info => {
                                    credentialsActions.updateUserData({ _id: info.userId });
                                });
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
    });

export default client;