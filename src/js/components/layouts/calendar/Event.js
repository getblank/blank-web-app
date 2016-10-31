import React from "react";

const s = {
    wrapper: {
        marginTop: "2px",
        padding: "4px",
        backgroundColor: "#ECEFF1",
        borderRadius: "5px",
        cursor: "pointer",
    },
    name: {
        display: "block",
        width: "100%",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
    },
};

const Event = ({style, name}) => {
    const clickHandler = (e) => {
        e.stopPropagation();
    };
    return (
        <div style={Object.assign({}, s.wrapper, style)} onClick={clickHandler}>
            <span style={s.name}>{name}</span>
        </div>
    );
};

export default Event;