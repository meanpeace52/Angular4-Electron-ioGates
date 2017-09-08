
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
  api: {
    base: 'https://share-web02-transferapp.iogates.com/api',
    auth: '/authtoken',
    files: '/files'
  }
};