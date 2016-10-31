import React from "react";

const s = {
    wrapper: {
        display: "flex",
        justifyContent: "center",
        width: "150px",
    },
    column: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "55px",
    },
    time: {
        fontSize: "1.8rem",
        // fontWeight: 300,
    },
    btnMin: {
        paddingLeft: "8px",
    },
    btnMin2: {
        paddingLeft: "16px",
    },
};

const BTN_CLASS = "tbtn-LDJA437";

const TimePicker = ({hours, min}) => {
    return (
        <div style={s.wrapper}>
            <style>{`
                .${BTN_CLASS} {color: rgba(0,0,0,.54); cursor: pointer; margin: 3px 0; user-select: none;}
                .${BTN_CLASS} i {vertical-align: bottom}
                .${BTN_CLASS}:hover {color: rgba(0,0,0,.87)}
            `}</style>
            <div style={s.column}>
                <div className={BTN_CLASS} style={s.btnMin}>
                    <i className="material-icons text md-14">add</i>3
                </div>
                <div className={BTN_CLASS}>
                    <i className="material-icons md-28">add</i>
                </div>
                <div style={s.time}>12</div>
                <div className={BTN_CLASS}>
                    <i className="material-icons md-28">remove</i>
                </div>
                <div className={BTN_CLASS} style={s.btnMin}>
                    <i className="material-icons text md-14">remove</i>3
                </div>
            </div>
            <div style={Object.assign({}, s.column, { width: "5px" })}>
                <div style={s.time}>:</div>
            </div>
            <div style={s.column}>
                <div className={BTN_CLASS} style={s.btnMin2}>
                    <i className="material-icons md-14">add</i>10
                </div>
                <div className={BTN_CLASS}>
                    <i className="material-icons md-28">add</i>
                </div>
                <div style={s.time}>00</div>
                <div className={BTN_CLASS}>
                    <i className="material-icons md-28">remove</i>
                </div>
                <div className={BTN_CLASS} style={s.btnMin2}>
                    <i className="material-icons md-14">remove</i>10
                </div>
            </div>
        </div>
    );
};

export default TimePicker;