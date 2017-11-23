import {Database} from '../../../lib/database';
import {Chunk, File, Share} from '../../../types';

describe('Share', () => {
  const database = new Database({
    name: 'chunktest',
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

  const fileData = {
    name: 'test file',
    file_id: 231,
    upload_filename: 'test_upload.download',
    type: 'movie',
    parent: null,
    created: Date.now(),
    href: 'https://iogates.com',
    downloaded: false,
    uploaded: false,
  };

  const testData = {
    uploaded: false,
    offset: 0,
    resume_url: 'https://iogates.com/resume',
    uuid: 'abc123',
    file_id: 1,
    starting_point: 0,
    ending_point: 10,
    size: 11,
    upload_started: false,
  };

  test('Save', () => {
    return db.sync().then(() => {
      return (new File(fileData)).save().then((f: File) => {
        testData.file_id = f.id;

        return (new Chunk(testData)).save().then((c: Chunk) => {
          expect(c.uuid).toBe(testData.uuid);
        });
      });
    });
  });
});
