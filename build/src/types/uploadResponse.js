"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UploadResponse {
    fromPromise(promise, file, dest) {
        return promise
            .then(() => {
            this.dest = dest;
            this.file = file;
            this.success = true;
            return this;
        });
    }
}
exports.UploadResponse = UploadResponse;
//# sourceMappingURL=uploadResponse.js.map