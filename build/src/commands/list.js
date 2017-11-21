"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const Table = require("cli-table");
function listCommand(args, done) {
    const entity = args.entity || args.options.entity;
    let fn = listAllShares;
    if (entity === 'file') {
        fn = listAllFiles;
    }
    return global['_DB']
        .sync()
        .then(() => {
        return fn();
    })
        .then(() => {
        return done();
    })
        .catch(done);
}
exports.listCommand = listCommand;
function listAllShares() {
    return types_1.Share.findAll({
        order: [
            ['updated_at', 'DESC']
        ],
        raw: true,
        attributes: ['id', 'dir', 'updated_at']
    })
        .then((shares) => {
        const table = new Table({
            head: [
                'ID', 'DESTINATION', 'LAST ACTIVITY'
            ],
            colWidths: [6, 55, 40],
            style: {
                head: ['yellow'],
                border: ['white']
            }
        });
        table.push(...types_1.Share.ForTableOutput(shares));
        console.log(table.toString());
    });
}
function listAllFiles() {
}
//# sourceMappingURL=list.js.map