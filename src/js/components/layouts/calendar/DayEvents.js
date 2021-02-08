import React from "react";
import LabelsContainer from "../../labels/LabelsContainer";

const EVENT_CLASS = "event-DADKJE8434";
const s = {
    event: {
        display: "flex",
        borderBottom: "1px solid rgba(0,0,0,.12)",
    },
    time: {
        padding: "7px",
        color: "rgba(0,0,0,.54)",
        fontSize: ".9rem",
    },
    desc: {
        padding: "7px",
        minWidth: "0px",
    },
    title: {
        display: "block",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    labels: {
        marginTop: "4px",
        fontSize: ".9rem",
    },
};

const DayEvents = ({ events, dateProp, moment, onEventClick }) => {
    const clickHandler = (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        onEventClick(id);
    };
    return (
        <div>
            <style>{`
                .${EVENT_CLASS} { cursor: pointer; }
                .${EVENT_CLASS}:hover { background-color: #f0f0f0; }
                `}</style>
            {events.map((e, i) => {
                const date = moment(e[dateProp]);

                return (
                    <div
                        key={i}
                        style={{ ...s.event, background: e.color }}
                        className={EVENT_CLASS}
                        onClick={clickHandler}
                        data-id={e._id}
                    >
                        <div style={s.time}>{date.format("HH:mm")}</div>
                        <div style={s.desc}>
                            <span style={s.title}>{e.name}</span>
                            <div style={s.labels}>
                                <LabelsContainer item={e} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DayEvents;
