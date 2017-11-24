import { Sequelize } from 'sequelize-typescript';
import { DownloadActivity } from '../../lib/downloadActivity';
import { File, Share } from '../../types';

describe.skip('download activity', () => {
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
      storage: '../iogates-test.sqlite', // change this with your absolute path.
      pool: {
        max: 1,
      },
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

  it('should have a `resume` method', () => {
    expect(activity.resume).toBeDefined();
  });

  it('should `resume` the activity', () => {
    const data = activity.resume();
    expect(data.type).toBe('download');
    expect(data.action).toBe('resume');
    expect(data.payload).toBeInstanceOf(Object);
    expect(data.payload.file).toBeDefined();
    expect(data.payload.file).toBe(file.file_id);
  });

  it('should have a `failed` method', () => {
    expect(activity.failed).toBeDefined();
  });

  it('should `failed` the activity', () => {
    const data = activity.failed('FAKE_MESSAGE');
    expect(data).toBeInstanceOf(Object);
    expect(data.type).toBe('download');
    expect(data.action).toBe('failed');
    expect(data.payload.file).toBeDefined();
    expect(data.payload.file).toBe(file.file_id);
    expect(data.payload.reason).toBe('FAKE_MESSAGE');
  });

  it('should have a `progress` method', () => {
    expect(activity.progress).toBeDefined();
  });

  it('should send `progress` for the activity', () => {
    const data = activity.progress(20, 23311);
    expect(data).toBeInstanceOf(Object);
    expect(data.type).toBe('download');
    expect(data.action).toBe('progress');
    expect(data.payload.file).toBeDefined();
    expect(data.payload.file).toBe(file.file_id);
    expect(data.payload.rate).toBe(23311);
    expect(data.payload.percent).toBe(20);
  });
});
