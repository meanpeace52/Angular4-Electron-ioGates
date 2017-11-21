"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const directory_1 = require("../lib/directory");
const iogates_1 = require("../lib/iogates");
function addCommand(args, done) {
    const destination = args.dir;
    const shareUrl = args.url;
    const ioGate = new iogates_1.IOGates();
    const directory = new directory_1.Directory(destination);
    const logger = global['logger'];
    global['_DB']
        .sync()
        .then(() => {
        return directory.create();
    })
        .then(() => {
        return types_1.Share.LOOKUP(shareUrl, destination);
    })
        .then((share) => {
        ioGate.setApiUrlFromShareUrl(share.url);
        return ioGate.authenticateFromUrl(share);
    })
        .then((share) => {
        share.direction = args.direction.toUpperCase();
        return share.save();
    })
        .then((share) => {
        logger.info('add share ' + share.id);
    })
        .then(() => {
        return done();
    })
        .catch(done);
}
exports.addCommand = addCommand;
//# sourceMappingURL=add.js.map