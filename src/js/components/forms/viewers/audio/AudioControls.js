/**
 * Created by kib357 on 18/10/15.
 */

import React from "react";
import audioStore from "../../../../stores/audioStore.js";
import audioActions from "../../../../actions/audioActuators.js";
import AudioProgressBar from "./AudioProgressBar.js";
import { storeEvents } from "constants";

class AudioControls extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.getStateFromStore(props);
        this.getStateFromStore = this.getStateFromStore.bind(this);
        this.play = this.play.bind(this);
        this.stop = this.stop.bind(this);
        this.pause = this.pause.bind(this);
        this.changeTimePosition = this.changeTimePosition.bind(this);
        this._onChange = this._onChange.bind(this);
    }

    getStateFromStore(props) {
        props = props || this.props;
        const currentAudio = audioStore.get();
        const res = {};
        res.active = props.src === currentAudio.src;
        res.playerState = res.active ? currentAudio.state : null;
        res.currentTime = res.active ? currentAudio.currentTime : null;
        res.duration = res.active ? currentAudio.duration : null;
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

    play() {
        audioActions.play(this.props.src);
    }

    stop() {
        audioActions.stop();
    }

    pause() {
        audioActions.pause();
    }

    changeTimePosition(newTime) {
        audioActions.changeTimePosition(newTime);
    }

    render() {
        if (!this.props.src) {
            return null;
        }

        return (
            <div>
                <a href={this.props.src} target="_blank">
                    <i className="material-icons text md-18">file_download</i>
                </a>
                {this.state.active && this.state.playerState === "playing" ?
                    <button type="button" className="btn-icon" onClick={this.pause}>
                        <i className="material-icons text">pause_circle_outline</i>
                    </button>
                    :
                    <button type="button" className="btn-icon" onClick={this.play}>
                        <i className="material-icons text">play_circle_outline</i>
                    </button>}

                {this.state.active && <AudioProgressBar
                    duration={this.state.duration}
                    currentTime={this.state.currentTime}
                    changeTimePosition={this.changeTimePosition}
                />
                }
            </div>
        );
    }
}

AudioControls.propTypes = {};
AudioControls.defaultProps = {};

export default AudioControls;