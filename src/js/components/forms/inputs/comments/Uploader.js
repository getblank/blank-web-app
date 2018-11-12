/**
 * Created by kib357 on 28/05/15.
 */

const React = require("react"),
    createReactClass = require("create-react-class"),
    find = require("utils/find"),
    transliterate = require("utils/translit");

const Uploader = createReactClass({
    getInitialState: function() {
        const state = {
            uploads: [],
        };
        return state;
    },
    upload: function(file, name) {
        const self = this;
        const upload = {
            name: file.name,
            progress: 0,
            xhr: new XMLHttpRequest(),
        };
        const uploads = this.state.uploads;
        uploads.push(upload);
        self.forceUpdate();
        const formData = new FormData();
        const fileName = transliterate(name || file.name);
        console.log("!!!!fileName: " + fileName);
        formData.append(fileName.substr(0, fileName.lastIndexOf(".")) || fileName, file);

        upload.xhr.upload.addEventListener(
            "progress",
            function(e) {
                if (e.lengthComputable) {
                    var percentage = Math.round((e.loaded * 100) / e.total);
                    upload.progress = percentage;
                    self.forceUpdate();
                }
            },
            false,
        );
        upload.xhr.upload.addEventListener(
            "load",
            function(e) {
                var index = find.indexById(self.state.uploads, upload._id);
                self.state.uploads.splice(index, 1);
                self.forceUpdate();
                if (typeof self.props.onUpload === "function") {
                    self.props.onUpload(name || file.name, fileName);
                }
            },
            false,
        );
        upload.xhr.upload.addEventListener("abort", function(e) {
            console.log("cancelling upload...");
            var index = find.indexById(self.state.uploads, upload._id);
            self.state.uploads.splice(index, 1);
            self.forceUpdate();
        });
        const params = this.props.params ? "&" + this.props.params : "";
        upload.xhr.open("POST", location.origin + (this.props.path || "/upload") + "?" + params);
        upload.xhr.send(formData);
    },
    cancelUpload: function(upload) {
        upload.xhr.abort();
    },
    render: function() {
        const uploads = this.state.uploads.map((e,i)=> {
            return (
                <div key={i} className="loop-upload">
                    <div className="loop-progress">
                        <div style={{ width: e.progress + "%" }} />
                    </div>
                    <div className="loop-upload-name">
                        <span>{e.name}</span>
                    </div>
                    <a onClick={this.cancelUpload.bind(this, i)}>
                        <i className="fa fa-remove" />
                    </a>
                </div>
            );
        }, this);
        return <div>{uploads}</div>;
    },
});

export default Uploader;
