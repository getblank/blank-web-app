import React, { Component } from "react";
import Event from "./Event";

const EVENT_HEIGHT = 23;
const HIDDEN_COUNTER_HEIGHT = 14;

const s = {
    wrapper: {
        position: "relative",
        flex: "1 0",
    },
    calendarEvent: {
        fontSize: ".8rem",
    },
    hiddenCounter: {
        position: "absolute",
        bottom: 0,
        right: 0,
        fontSize: ".9rem",
        fontWeight: 100,
        background: "white",
        borderRadius: 2,
        paddingLeft: 3,
    },
};

class MonthDayEvents extends Component {
    constructor(props) {
        super(props);
        this.state = { visibleCount: 0 };
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.events.length !== prevProps.events.length) {
            this.calcVisibleCount();
        }
    }

    eventsMouseOverHandler(e) {
        e.stopPropagation();
    }

    calcVisibleCount() {
        const { events } = this.props;
        if (events.length > 0) {
            const parent = this.wrapper.parentElement;
            let visibleCount = Math.floor(parent.clientHeight / EVENT_HEIGHT);
            if (visibleCount < events.length) {
                const maxHeight = parent.clientHeight - HIDDEN_COUNTER_HEIGHT;
                visibleCount = Math.max(Math.floor(maxHeight / EVENT_HEIGHT), 1);
            }

            if (this.state.visibleCount !== visibleCount) {
                this.setState({ visibleCount });
            }
        }
    }

    render() {
        const { events, colorProp } = this.props;
        const { visibleCount } = this.state;
        const hiddenCounter = events.length - visibleCount;
        return (
            <div ref={(el) => (this.wrapper = el)} style={s.wrapper}>
                <div onMouseOver={this.eventsMouseOverHandler}>
                    {events.map((event, i) => {
                        const style = Object.assign({}, s.calendarEvent);
                        if (event[colorProp]) {
                            style.backgroundColor = event[colorProp];
                        }

                        return i < visibleCount && <Event key={i} {...event} style={style} />;
                    })}
                    {hiddenCounter > 0 && <div style={s.hiddenCounter}>+{hiddenCounter}</div>}
                </div>
            </div>
        );
    }
}

export default MonthDayEvents;
