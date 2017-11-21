"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const directory_1 = require("../lib/directory");
function removeCommand(args, done) {
    const removeFromDir = args.options.remove;
    let executor;
    if (args.options.id) {
        executor = types_1.Share.DeleteById(args.options.id);
    }
    if (args.options.dir) {
        executor = types_1.Share.DeleteByDir(args.options.dir);
    }
    if (args.options.url) {
        executor = types_1.Share.DeleteByUrl(args.options.url);
    }
    return executor
        .then(() => {
        if (!!removeFromDir && args.options.dir) {
            return directory_1.Directory.delete(args.options.dir);
        }
        return null;
    })
        .then(() => {
        console.log('[remove] command executed successfully.');
    })
        .catch(done);
}
exports.removeCommand = removeCommand;
//# sourceMappingURL=remove.js.map