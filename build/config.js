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
    },
    logs: {
        devMode: false,
        error: `${process.cwd()}/logs/iogates.error.log`,
        info: `${process.cwd()}/logs/iogates.info.log`
    }
};
//# sourceMappingURL=config.js.map