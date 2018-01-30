/**
 * Created by kib357 on 18/10/15.
 */

import dispatcher from "../dispatcher/blankDispatcher";
import { userActions } from "constants";

export default {
    play: (src) => {
        dispatcher.dispatch({
            actionType: userActions.AUDIO_PLAY,
            src,
        });
    },
    stop: () => {
        dispatcher.dispatch({
            actionType: userActions.AUDIO_STOP,
        });
    },
    pause: () => {
        dispatcher.dispatch({
            actionType: userActions.AUDIO_PAUSE,
        });
    },
};