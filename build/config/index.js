"use strict";
module.exports = {
    database: {
        name: 'iogates',
        dialect: 'sqlite',
        username: 'root',
        password: '',
        logging: false,
        storage: `${process.cwd()}/iogates.sqlite`,
        pool: {
            max: 1
        }
    }
};
//# sourceMappingURL=index.js.map