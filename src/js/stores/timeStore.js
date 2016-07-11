/**
 * Created by kib357 on 18/11/15.
 */

import BaseStore from "./baseStore.js";
import timeActions from "../actions/timeActuators.js";
import { serverActions } from "constants";

class TimeStore extends BaseStore {
    constructor(props) {
        super(props);
        this.offset = 0;
        this.requsts = [];

        this.get = this.get.bind(this);
        this.load = this.load.bind(this);
    }

    get() {
        return new Date(Date.now() - this.offset);
    }

    getOffset() {
        return this.offset;
    }

    load() {
        this.requsts.push({
            "start": Date.now(),
        });
        timeActions.load();
    }

    __handleTimeUpdate(serverTime) {
        console.log("TIME:", serverTime);
        let r = this.requsts[this.requsts.length - 1];
        r.end = Date.now();
        r.res = new Date(serverTime).getTime();
        r.latency = (r.end - r.start) / 2;
        this.offset = this.requsts.reduce((prev, current) => {
            current.offset = current.start - current.res;
            return prev + (current.offset + current.latency);
        }, 0) / this.requsts.length;
        console.log("OFFSET:", this.offset);
        console.log("REQUESTS:", this.requsts);
        if (this.requsts.length < 5) {
            this.t = setTimeout(() => {
                this.load();
            }, 3000);
        }
        this.__emitChange();
    }

    __onDispatch(payload) {
        switch (payload.actionType) {
            case serverActions.TIME:
                this.__handleTimeUpdate(payload.data);
                break;
            case serverActions.CONNECTED_EVENT:
                this.t = setTimeout(() => {
                    this.load();
                }, 3000);
                break;
            case serverActions.DISCONNECTED_EVENT:
                clearTimeout(this.t);
                this.offset = 0;
                this.requsts = [];
                break;
        }
    }
}

export default new TimeStore();