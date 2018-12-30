import dispatcher from "../dispatcher/blankDispatcher";
import alerts from "../utils/alertsEmitter";
import { serverActions } from "constants";

let pathPrefix = "";
const matched = window.location.pathname.match(/(.*)\/app\//);
if (matched) {
    pathPrefix = matched[1];
}
class WidgetActuators {
    load(storeName, widgetId, data, itemId) {
        let statusText;
        const uri = `itemId=${itemId}&data=${JSON.stringify(data)}`;
        const uriString = encodeURI(uri);

        fetch(`${pathPrefix}/api/v1/${storeName}/widgets/${widgetId}/load?${uriString}`, { credentials: "include" })
            .then(res => {
                if (res.status !== 200) {
                    statusText = res.statusText;
                }

                return res.json();
            })
            .then(data => {
                if (statusText) {
                    throw new Error(`${statusText} : ${data}`);
                }

                dispatcher.dispatch({
                    actionType: serverActions.WIDGET_DATA_LOADED,
                    data,
                    widgetId: widgetId,
                });
            })
            .catch(err => {
                dispatcher.dispatch({
                    actionType: serverActions.WIDGET_DATA_LOADED,
                    error: err.message,
                    widgetId: widgetId,
                });
                console.error("[widgetsActuators:load]", err);
                alerts.error(err);
            });
    }
}

export default new WidgetActuators();
