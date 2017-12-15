import React, { Component } from "react";
import ReactAce from "react-ace";
import "brace/mode/javascript";

class CodeEditor extends Component {
    render() {
        return (
            <div style={{ marginTop: "14px" }}>
                <ReactAce
                    mode="javascript"
                    height="400px"
                    value={this.props.value}
                    onChange={this.props.onChange} />
            </div>
        );
    }
}

export default CodeEditor;