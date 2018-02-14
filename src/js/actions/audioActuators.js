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
    timeUpdate: (currentTime, duration) => {
        dispatcher.dispatch({
            actionType: userActions.AUDIO_UPDATE_TIME,
            currentTime,
            duration,
        });
    },
    changeTimePosition: (newTime) => {
        dispatcher.dispatch({
            actionType: userActions.AUDIO_CHANGE_TIME,
            newTime,
        });
    },
    error: () => {
        dispatcher.dispatch({
            actionType: userActions.AUDIO_PLAY_ERROR,
        });
    },
};