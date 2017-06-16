/**
 * Created by kib357 on 31/01/16.
 */

import dispatcher from "../dispatcher/blankDispatcher";
import { userActions, serverActions } from "constants";

let baseUri;
let pathname = window.location.pathname;
const rgx = /^.*?\/app\//;
const matched = pathname.match(rgx);
if (matched) {
    baseUri = location.origin + (matched + "").replace("/app", "") + "files/";
} else {
    pathname += "/";
    const matched = pathname.match(rgx);
    if (matched) {
        baseUri = location.origin + (matched + "").replace("/app", "") + "files/";
    } else {
        console.error("Invalid url found, can't use fileUpload");
    }
}

class FileUploadActuators {
    newUploads(uploads) {
        dispatcher.dispatch({
            actionType: userActions.FILE_UPLOAD_NEW,
            uploads: uploads,
        });
    }

    cancelUpload(id) {
        dispatcher.dispatch({
            actionType: userActions.FILE_UPLOAD_CANCEL,
            uploadId: id,
        });
    }

    createUploadRequest(upload) {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("file", upload.file, upload.file.name);

        xhr.upload.addEventListener("progress", function (e) {
            if (e.lengthComputable) {
                let percentage = Math.round((e.loaded * 100) / e.total);
                dispatcher.dispatch({
                    actionType: serverActions.FILE_UPLOAD_RESPONSE,
                    type: "progress",
                    uploadId: upload._id,
                    progress: percentage,
                });
            }
        }, false);
        xhr.upload.addEventListener("abort", function (e) {
            dispatcher.dispatch({
                actionType: serverActions.FILE_UPLOAD_RESPONSE,
                type: "abort",
                uploadId: upload._id,
            });
        });
        xhr.addEventListener("readystatechange", function (e) {
            if (xhr.readyState === 4) {
                dispatcher.dispatch({
                    actionType: serverActions.FILE_UPLOAD_RESPONSE,
                    type: "result",
                    uploadId: upload._id,
                    xhr: xhr,
                });
            }
        });
        xhr.open("POST", this.getUri(upload._id, upload.targetStore));
        xhr.send(formData);

        return xhr;
    }

    createDeleteRequest(upload) {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("id", upload._id);
        xhr.open("DELETE", this.getUri(upload._id, upload.targetStore));
        xhr.send(formData);
    }

    getUri(id, targetStore) {
        return baseUri + targetStore + "/" + id;
    }
}

export default new FileUploadActuators();