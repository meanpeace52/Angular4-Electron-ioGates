import * as assert from 'assert';
import {Sequelize} from 'sequelize-typescript';
import {File} from '../../../types/models/file';
import {Share} from '../../../types/models/share';
import {Chunk} from '../../../types/models/chunk';

describe('Share', () => {
  beforeAll(() => {
    const db = new Sequelize({
      name: 'sharetest',
      dialect: 'sqlite',
      username: 'root',
      password: '',
      logging: false,
      storage: './sharetest.sqlite', // change this with your absolute path.
      pool: {
        max: 1,
      },
      operatorsAliases: false,
    });

    db.addModels([File, Share, Chunk]);

    return db.sync().then(() => {
      return;
    });
  });

  describe('Save', () => {
    const share = new Share({
      dir: './foo/bar',
      url: 'https://iogates.com',
      token: '123abc',
      complete: 0,
      direction: Share.DIRECT_DOWNLOAD,
    });

    return share.save();
  /*
    return Share.create({
      dir: './foo/bar',
      url: 'https://iogates.com',
      token: '123abc',
      complete: 0,
      direction: Share.DIRECT_DOWNLOAD,
    });*/
  });
});
