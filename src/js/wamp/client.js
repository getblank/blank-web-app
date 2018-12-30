/**
 * Created by kib357 on 21/02/15.
 */
import connectionActions from "../actions/connectionActuator.js";
import credentialsActions from "../actions/credentialsActuators.js";
import alerts from "../utils/alertsEmitter";
import i18n from "../stores/i18nStore";
import { BlankClient } from "blank-web-sdk";


let authorized = false;
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
                    authorized = true;
                    connectionActions.connected();
                    break;
                case "unauthorized":
                    if (authorized) {
                        authorized = false;
                        // alerts.error(i18n.get("errors.sessionExpired") || "Session deleted or expired", 8);
                    }

                    connectionActions.disconnected();
                    credentialsActions.clearUserData();
                    break;
                default:
                    connectionActions.disconnected();
                    break;
            }
        });
    });

export default client;