import React, { Component } from "react";
import Event from "./Event";

const EVENT_HEIGHT = 23;
const HIDDEN_COUNTER_HEIGHT = 14;

const s = {
    wrapper: {
        position: "relative",
        flex: "2 0",
        height: "100%",
    },
    calendarEvent: {
        fontSize: ".8rem",
    },
    hiddenCounter: {
        position: "absolute",
        bottom: 0,
        right: 0,
        fontSize: ".9rem",
        fontWieght: 100,
    },
};

class MonthDayEvents extends Component {
    constructor(props) {
        super(props);
        this.state = { maxHeight: 0 };
    }

    componentDidMount() {
        this.componentdidRender();
    }

    componentDidUpdate(prevProps, prevState) {
        this.componentdidRender();
    }

    eventsMouseOverHandler(e) {
        e.stopPropagation();
    }

    componentdidRender() {
        if (this.props.events.length > 0) {
            const w = this.refs.wrapper;
            const c = w.parentElement; //container
            let maxHeight = c.clientHeight - HIDDEN_COUNTER_HEIGHT;//
            if (this.state.maxHeight !== maxHeight) {
                this.setState({ maxHeight });
            }
        }
    }

    render() {
        const {events, colorProp} = this.props;
        const visibleCount = Math.floor(this.state.maxHeight / EVENT_HEIGHT);
        const hiddenCounter = events.length - visibleCount;
        return (
            <div ref="wrapper" style={s.wrapper}>
                {(this.state.maxHeight > 0) &&
                    <div onMouseOver={this.eventsMouseOverHandler}>
                        {events.map((e, i) => {
                            const style = Object.assign({}, s.calendarEvent);
                            if (e[colorProp]) {
                                style.backgroundColor = e[colorProp];
                            }
                            return (
                                (i < visibleCount) && <Event
                                    key={i}
                                    {...e}
                                    style={style}
                                    />
                            );
                        })}
                        {(hiddenCounter > 0) && <div style={s.hiddenCounter}>+{hiddenCounter}</div>}
                    </div>}
            </div>
        );
    }
}

export default MonthDayEvents;