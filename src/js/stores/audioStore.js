/**
 * Created by kib357 on 18/10/15.
 */

import BaseStore from "./baseStore";
import { serverActions, userActions } from "constants";

class AudioStore extends BaseStore {
    constructor() {
        super();
        this.src = null;
        this.state = null;
        this.currentTime = null;
        this.duration = null;
        this.newTime = null;
    }

    get() {
        return {
            src: this.src,
            state: this.state,
            currentTime: this.currentTime,
            duration: this.duration,
            newTime: this.newTime,
        };
    }

    __onDispatch(payload) {
        switch (payload.actionType) {
            case serverActions.DISCONNECTED_EVENT:
                this.src = null;
                break;
            case userActions.AUDIO_PLAY:
                this.src = payload.src;
                this.state = "playing";
                break;
            case userActions.AUDIO_STOP:
                this.state = "stopped";
                break;
            case userActions.AUDIO_PAUSE:
                this.state = "paused";
                break;
            case userActions.AUDIO_UPDATE_TIME:
                this.currentTime = payload.currentTime;
                this.duration = payload.duration;
                break;
            case userActions.AUDIO_CHANGE_TIME:
                this.newTime = payload.newTime;
                break;
        }
        this.__emitChange();
    }
}
let store = new AudioStore();
export default store;