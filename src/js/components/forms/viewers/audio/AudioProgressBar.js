
import React from "react";

class AudioProgressBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentIntent: 0,
            toggle: false,
        };

        this.getHorizontalValue = this.getHorizontalValue.bind(this);
        this.handleIntentMove = this.handleIntentMove.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.toggleBarTime = this.toggleBarTime.bind(this);
    }

    getHorizontalValue(mouseX) {
        const rect = this.progressBarElement.getBoundingClientRect();
        const scrollX = (window.pageXOffset !== undefined)
            ? window.pageXOffset
            : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
        let dLeft = mouseX - (rect.left + scrollX);
        dLeft = Math.max(dLeft, 0);
        dLeft = Math.min(dLeft, rect.width);

        return dLeft / rect.width;
    }

    handleIntentMove(mouseEvent) {
        const relativeTime = this.getHorizontalValue(mouseEvent.pageX);
        this.setState({ currentIntent: relativeTime });
    }

    handleClick(mouseEvent) {
        const newTime = this.getHorizontalValue(mouseEvent.pageX);
        this.props.changeTimePosition(newTime);
    }

    toggleBarTime() {
        this.setState({ toggle: !this.state.toggle });
    }

    render() {
        const { currentTime, duration } = this.props;
        const { currentIntent, toggle } = this.state;

        const progressPercent = (currentTime && duration) ? Math.min(100, 100 * currentTime / duration) : 0;
        const styleLeft = `${progressPercent}%`;

        let barTime;
        if (!toggle) {
            barTime = (duration && duration !== Infinity && !isNaN(duration))
                ? timeFormat(duration) : "00:00";
        } else {
            barTime = (currentTime && currentTime !== Infinity && !isNaN(currentTime))
                ? timeFormat(currentTime) : "00:00";
        }

        return [<div key="progressBar" className="progressBar" ref={(div) => this.progressBarElement = div}>
            <div className="progressBarIntent" style={{ width: `${currentIntent * 100}%` }}></div>
            <div className="progressBarElapsed" style={{ width: styleLeft }}></div>
            <div
                className="progressBarSeek"
                onMouseMove={this.handleIntentMove}
                onClick={this.handleClick}
            ></div>
        </div>,
        <div key="progressBarTime" className="progressBarTime" onClick={this.toggleBarTime}>
            {barTime}
        </div>];
    }
}

export default AudioProgressBar;


const timeFormat = (function () {
    function num(val) {
        val = Math.floor(val);
        return val < 10 ? "0" + val : val;
    }
    return function (sec) {
        const seconds = Math.floor(sec) % 60
            , minutes = Math.floor(sec / 60);

        return num(minutes) + ":" + num(seconds);
    };
})();