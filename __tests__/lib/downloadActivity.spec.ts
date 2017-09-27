import { Sequelize } from 'sequelize-typescript';
import { DownloadActivity } from '../../src/lib/downloadActivity';
import { File, Share } from '../../src/types';

describe('download activity', () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
  let activity = new DownloadActivity();
  let file: File;

  beforeAll(() => {
    // file.file_id = 555;
    const sequelize = new Sequelize({
      name: 'iogates',
      dialect: 'sqlite',
      username: 'root',
      password: '',
      logging: false,
      storage: `../iogates-test.sqlite`, // change this with your absolute path.
      pool: {
        max: 1
      }
    });
    sequelize.addModels([File, Share]);
    return sequelize
      .sync()
      .then(() => {
        file = new File({
          file_id: 555
        });
        return activity.onceReady();
      });
  });

  it('should have a `attachFile` method', () => {
    expect(activity.attachFile).toBeInstanceOf(Function);
  });

  it('should attach file', () => {
    activity.attachFile(file);
    expect(activity.file).toEqual(file);
    expect(activity.getFile()).toEqual(file);
  });

  it('should have a `start` method', () => {
    expect(activity.start).toBeDefined();
  });

  it('should `start` the activity', () => {
    const data = activity.start();
    expect(data.type).toBe('download');
    expect(data.action).toBe('start');
    expect(data.payload).toBeInstanceOf(Object);
    expect(data.payload.file).toBeDefined();
    expect(data.payload.file).toBe(file.file_id);
  });
});