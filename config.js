
module.exports = {
  database: {
    name: 'iogates',
    dialect: 'sqlite',
    username: 'root',
    password: '',
    logging: false,
    storage: `${process.cwd()}/iogates.sqlite`, // change this with your absolute path.
    pool: {
      max: 1
    }
  },
  logs: {
    devMode: false, // change to true to see all logs on console.
    error: `${process.cwd()}/logs/iogates.error.log`,
    info: `${process.cwd()}/logs/iogates.info.log`
  }
};