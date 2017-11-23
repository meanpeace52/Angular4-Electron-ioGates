import {Database} from '../../../lib/database';
import {Share} from '../../../types';

describe('Share', () => {
  const database = new Database({
    name: 'test',
    dialect: 'sqlite',
    username: 'root',
    password: '',
    logging: false,
    storage: ':memory:',
    pool: {
      max: 1,
    },
    operatorsAliases: false,
  });
  const db = database.getDatabase();

  const testData = {
    dir: './foo/bar',
    url: 'https://iogates.com',
    token: '123abc',
    complete: false,
    direction: Share.DIRECT_DOWNLOAD,
  };

  test('Save', (done: Function) => {
    return db.sync().then(() => {
      const share = new Share(testData);

      share.save().then(() => {
        done();
      });
    });
  });

  test('LOOKUP existing data', () => {
    expect.assertions(5);

    return Share.LOOKUP(testData.url, testData.dir).then((share: Share) => {
      expect(share.token).toBe(testData.token);
      expect(share.url).toBe(testData.url);
      expect(share.dir).toBe(testData.dir);
      expect(share.complete).toBe(testData.complete);
      expect(share.direction).toBe(Share.DIRECT_DOWNLOAD);
    });
  });

  test('LOOKUP new share', () => {
    expect.assertions(5);

    return Share.LOOKUP('https://iogates.com/some/url', './some/path').then((share: Share) => {
      expect(share.token).toBe('');
      expect(share.url).toBe('https://iogates.com/some/url');
      expect(share.dir).toBe('./some/path');
      expect(share.complete).toBe(false);
      expect(share.direction).toBe(Share.DIRECT_DOWNLOAD);
    });
  });

  test('DeleteByUrl', () => {
    expect.assertions(1);
    testData.url = 'https://iogates.com/DeleteByUrl';

    return db.sync().then(() => {
      const share = new Share(testData);

      return share.save().then(() => {
        const id = share.id;

        return Share.DeleteByUrl(testData.url).then(() => {
          return Share.findById(id).then((s: Share|null) => {
            expect(s).toBe(null);
          });
        });
      });
    });
  });

  test('DeleteById', () => {
    expect.assertions(1);

    return db.sync().then(() => {
      const share = new Share(testData);

      return share.save().then(() => {
        const id = share.id;

        return Share.DeleteById(id).then(() => {
          return Share.findById(id).then((s: Share|null) => {
            expect(s).toBe(null);
          });
        });
      });
    });
  });

  test('DeleteByDir', () => {
    expect.assertions(1);
    testData.dir = './DeleteByDir';

    return db.sync().then(() => {
      const share = new Share(testData);

      return share.save().then(() => {
        const id = share.id;

        return Share.DeleteByDir(share.dir)
          .then(() => {
            return Share.findById(id).then((s: Share|null) => {
              expect(s).toBe(null);
            });
          });
      });
    });
  });

  /*test('forTableOutput', () => {
    expect.assertions(1);
    const data = {
      dir: './foo/bar',
      url: 'https://iogates.com',
      token: '123abc',
      complete: false,
      direction: Share.DIRECT_DOWNLOAD,
    };

    return db.sync().then(() => {
      const share = new Share(data);

      return share.save().then((s) => {
        expect(Share.ForTableOutput([s])).toBe(
          [data.dir, data.url, data.token, data.complete, data.direction]
        );
      });
    });
  });*/
});
