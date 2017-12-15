import React, { Component } from "react";
import ReactAce from "react-ace";
import brace from 'brace';
import "brace/mode/javascript";
import 'brace/theme/github';

class CodeEditor extends Component {
    render() {
        return (
            <div style={{ marginTop: "14px" }}>
                <ReactAce
                    mode="javascript"
                    theme="github"
                    height="300px"
                    value={this.props.value}
                    onChange={this.props.onChange} />
            </div>
        );
    }
}

export default CodeEditor;