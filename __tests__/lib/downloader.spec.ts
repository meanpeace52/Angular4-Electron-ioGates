import { Downloader } from '../../src/lib/downloader';
import { File, UploadResponse } from '../../src/lib/types';
import * as fs from 'fs';
import * as crypto from 'crypto';

describe.skip('Downloader', () => {
  const resourceUrl = 'https://web02-transferapp.iogates.com/download-file/375/0/0/1/0/2U6VQiwovZfLQaVLoHbPMabSlJye2Voe';
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
    file.download = resourceUrl;
    const destination = '/tmp';

    return downloader
      .downloadFile(file, destination)
      .then((response: UploadResponse) => {
        const content = fs.readFileSync(response.dest);
        const checksum = crypto
          .createHash('md5')
          .update(content)
          .digest('hex');
        expect(file.md5).toEqual(checksum);
      });
  });

  it('should have the `downloadFiles` method', () => {
    expect(downloader.downloadFiles).toBeDefined();
  });

  it('should download multiple files at once', () => {
    const destination = '/tmp';

    const file1: File = new File();
    file1.name = 'IMG_0752_1.JPG';
    file1.type = 'image';
    file1.id = 375;
    file1.parent = 373;
    file1.md5 = '812abd8d7ceda3b738ca3ac79d4a0c5c';
    file1.download = resourceUrl;

    const file2: File = new File();
    file2.name = 'IMG_0752_2.JPG';
    file2.type = 'image';
    file2.id = 375;
    file2.parent = 373;
    file2.md5 = '812abd8d7ceda3b738ca3ac79d4a0c5c';
    file2.download = resourceUrl;

    const files: File[] = [];
    files.push(file1, file2);
    const promise = downloader.downloadFiles(files, destination);

    return promise
      .then((response: UploadResponse[]) => {
        expect(response).toHaveLength(2);
        expect(response[0].success).toBeTruthy();
        expect(response[1].success).toBeTruthy();
      })
      .catch((e: Error) => {
        console.log(e);
      });
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
  });
});
