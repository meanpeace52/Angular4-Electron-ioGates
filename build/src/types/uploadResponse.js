"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UploadResponse {
    fromPromise(promise, file) {
        return promise
            .then(() => {
            this.dest = file.destination;
            this.file = file;
            this.success = true;
            global['logger'].info('completed %s', file.destination);
            return this;
        });
    }
}
exports.UploadResponse = UploadResponse;
//# sourceMappingURL=uploadResponse.js.map