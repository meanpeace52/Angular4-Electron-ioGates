import {Sequelize} from 'sequelize-typescript';
import {File} from '../../../types/models/file';
import {Share} from '../../../types/models/share';
import {Chunk} from '../../../types/models/chunk';

describe('Share', () => {
  let db = new Sequelize({
    name: 'sharetest',
    dialect: 'sqlite',
    username: 'root',
    password: '',
    logging: false,
    storage: ':memory:', // change this with your absolute path.
    pool: {
      max: 1,
    },
    operatorsAliases: false,
  });

  db.addModels([File, Share, Chunk]);

  test('Save', (done: Function) => {
    return db.sync().then(() => {
      const share = new Share({
        dir: './foo/bar',
        url: 'https://iogates.com',
        token: '123abc',
        complete: 0,
        direction: Share.DIRECT_DOWNLOAD,
      });

      share.save().then(() => {done()});
    });
  });
});
