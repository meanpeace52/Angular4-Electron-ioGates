import { Downloader } from '../../src/lib/downloader';
import { File } from '../../src/lib/types';
import * as fs from 'fs';
import * as crypto from 'crypto';

describe('Downloader', () => {
  let downloader: Downloader;

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
    downloader = new Downloader();
  });

  it('should have a download method', () => {
    expect(downloader.downloadFile).toBeDefined();
  });

  it('should be able to download the file', () => {
    const file: File = new File();
    file.name = 'IMG_0752.JPG';
    file.type = 'image';
    file.id = 375;
    file.parent = 373;
    file.md5 = '812abd8d7ceda3b738ca3ac79d4a0c5c';
    file.download = 'https://web02-transferapp.iogates.com/download-file/375/0/0/1/0/iy82fJEPhwkmtcBDZAgVNep4UViKpoXJ';
    const dest = '/tmp/test-file.jpg';

    const promise = downloader.downloadFile(file, dest);
    promise
      .then((response: {}) => {
        const content = fs.readFileSync(dest);
        const checkSum = crypto
          .createHash('md5')
          .update(content)
          .digest('hex');
        expect(file.md5).toEqual(checkSum);
      });

    return promise;
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
  });
});
