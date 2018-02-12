/**
 * Created by kib357 on 18/10/15.
 */

import React from "react";
import audioStore from "../../../../stores/audioStore.js";
import audioActions from "../../../../actions/audioActuators.js";
import { storeEvents } from "constants";

class AudioPlayer extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.getStateFromStore(props);
        this.getStateFromStore = this.getStateFromStore.bind(this);
        this._onChange = this._onChange.bind(this);
        this.stop = this.stop.bind(this);
        this.onTimeUpdate = this.onTimeUpdate.bind(this);
    }

    getStateFromStore(props) {
        let currentAudio = audioStore.get(), res = {};
        res.src = currentAudio.src;
        res.playerState = currentAudio.state;
        res.newTime = currentAudio.newTime;
        return res;
    }

    _onChange() {
        this.setState(this.getStateFromStore());
    }

    componentDidMount() {
        audioStore.on(storeEvents.CHANGED, this._onChange);
    }

    componentWillUnmount() {
        audioStore.removeListener(storeEvents.CHANGED, this._onChange);
    }

    stop() {
        audioActions.stop();
    }

    error() {
        audioActions.error();
    }

    onTimeUpdate() {
        audioActions.timeUpdate(this.player.currentTime, this.player.duration);
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.player != null) {
            switch (this.state.playerState) {
                case "playing":
                    this.player.play()
                        .catch((err) => {
                            if (!this.player.duration || this.player.duration === Infinity) {
                                this.error();
                            }
                        });
                    this.player.addEventListener("timeupdate", this.onTimeUpdate);
                    break;
                case "paused":
                    this.player.pause();
                    this.player.removeEventListener("timeupdate", this.onTimeUpdate);
                    break;
                case "stopped":
                    this.player.pause();
                    this.player.currentTime = 0;
                    this.player.removeEventListener("timeupdate", this.onTimeUpdate);
                    break;
                case "error":
                    this.player.pause();
                    break;
            }

            if (this.state.newTime && prevState.newTime !== this.state.newTime
                && this.state.playerState === "playing"
                && this.player.duration && this.player.duration !== Infinity
            ) {
                this.player.currentTime = this.state.newTime * this.player.duration;
            }
        }
    }

    render() {
        return this.state.src ?
            <audio src={this.state.src}
                ref={(audio) => this.player = audio}
                onEnded={this.stop}>
            </audio> :
            null;
    }
}

AudioPlayer.propTypes = {};
AudioPlayer.defaultProps = {};

export default AudioPlayer;
