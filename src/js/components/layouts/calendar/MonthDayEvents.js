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
        fontWeight: 100,
    },
};

class MonthDayEvents extends Component {
    constructor(props) {
        super(props);
        this.state = { visibleCount: 0 };
    }

    componentDidMount() {
        this.calcVisibleCount();
    }

    componentDidUpdate(prevProps, prevState) {
        this.calcVisibleCount();
    }

    eventsMouseOverHandler(e) {
        e.stopPropagation();
    }

    calcVisibleCount() {
        if (this.props.events.length > 0) {
            const w = this.refs.wrapper;
            const c = w.parentElement; //container
            const maxHeight = c.clientHeight - HIDDEN_COUNTER_HEIGHT; //
            const visibleCount = Math.floor(maxHeight / EVENT_HEIGHT);
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
            <div ref="wrapper" style={s.wrapper}>
                {visibleCount > 0 && (
                    <div onMouseOver={this.eventsMouseOverHandler}>
                        {events.map((e, i) => {
                            const style = Object.assign({}, s.calendarEvent);
                            if (e[colorProp]) {
                                style.backgroundColor = e[colorProp];
                            }
                            return i < visibleCount && <Event key={i} {...e} style={style} />;
                        })}
                        {hiddenCounter > 0 && <div style={s.hiddenCounter}>+{hiddenCounter}</div>}
                    </div>
                )}
            </div>
        );
    }
}

export default MonthDayEvents;
