/**
 * Created by kib357 on 09/11/15.
 */

import dispatcher from "../dispatcher/blankDispatcher";
import client from "../wamp/client";
import {serverActions} from "constants";

class TimeActuators {
    load(storeName, id) {
        client.call("com.time", (error, data) => {
            if (data) {
                dispatcher.dispatch({
                    "actionType": serverActions.TIME,
                    "data": data,
                });
            }
        });
    }
}

export default new TimeActuators();