import { Upload } from 'tus-js-client';
import * as Type from './types';
import * as CliProgress from 'cli-progress';
import {UploadOptionsExtended} from '../types/uploadOptionExtended';
import {Directory} from './directory';
import {IOGates} from './iogates';
import * as _ from 'lodash';

export class Uploader {
  public baseUrl: string = 'https://share-web02-transferapp.iogates.com';
  public token: string = '';

  static CalculateUploadTransferSpeed(bytesUploaded: number, previousTimeStamp: number, previousBytes: number): any {
      const currentDateTimeStamp = Date.now();
      let bytes: number = bytesUploaded - previousBytes;
      let unit = 'MB/s';
      let megaBytes: number = (bytes / 1024) / 1024;
      if ((currentDateTimeStamp - previousTimeStamp) >= 1000) {
          bytes = bytesUploaded - previousBytes;
          megaBytes = ((bytes / 1024) / 1024);
      }
      if(megaBytes < 1) {
        megaBytes = megaBytes * 1024;
        unit = 'KB/s';
      }

      return { rate: Math.floor(megaBytes), previousBytes: bytesUploaded, previousTimeStamp: currentDateTimeStamp, unit: unit };
  }

  public uploadFiles(files: Type.File[], share: Type.Share): Promise<Type.File[]> {
    this.token = share.token;
    this.baseUrl = IOGates.GET_BASE_URL(share.url);
    let self = this;
    const results = [];
    // for (const file of files) {
    //   results.push(this.uploadFile(file));
    // }
    // return Promise.all(results)
    //   .then(files => files);

    return new Promise(async (resolve, reject) => {
      for (const file of files) {
        // results.push(this.uploadFile(file));
        try {
          const r: Type.File = await self.uploadFile(file);
          results.push(r);
        } catch (err) {

        }
      }

      return resolve(results);
    });
  }

  public uploadFile(file: Type.File): Promise<Type.File> {
    let logger = global['logger'];

    return new Promise((resolve: Function, reject: Function) => {
      const extIndex = _.lastIndexOf(file.name, '.');
      let calculations = {rate: 0, previousTimeStamp: 0, previousBytes: 0, unit: 'MB/s'};
      const bar = new CliProgress.Bar({
        format: `${file.name} \t [{bar}] {percentage}% | ETA: {eta}s | Speed: {speed}`,
        stopOnComplete: true,
        clearOnComplete: false,
        etaBuffer: 20,
        fps: 5,
        payload: {speed: 'N/A'}
      }, CliProgress.Presets.shades_classic);

      bar.start(100, 0);

      const uploadOptions: UploadOptionsExtended  = {
        endpoint: `${this.baseUrl}/upload/tus/${this.token}`,
        uploadUrl: null,
        uploadSize: file.size,
        resume: true,
        chunkSize: 16777216,
        retryDelays: [0, 1000, 3000, 5000],
        metadata: {
          filename: `${file.upload_filename}${file.name.substr(extIndex, file.name.length)}`,
          uuid: file.uuid
        },
        onError: (error) => {
          logger(JSON.stringify(error));
          tusUploader.abort();
          return reject(error);
        },
        onProgress: (bytesUploaded: number, bytesTotal: number) => {
          const percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
          calculations = Uploader.CalculateUploadTransferSpeed(
            bytesUploaded,
            calculations.previousTimeStamp,
            calculations.previousBytes
          );

          bar.update(percentage, {
            speed: `${calculations.rate} ${calculations.unit}`
          });
        },
        onSuccess: () => {
          file.uploaded = true;
          file.save()
            .then((f: Type.File) => {
              return resolve(f);
            });
        }
      };

      if (file.uploadStarted) {
        uploadOptions.uploadUrl = `${this.baseUrl}/upload/tus/${this.token}/${file.uuid}`;
      }
      const stream = <any> Directory.getStream(file.stream_path);
      const tusUploader = new Upload(stream, uploadOptions);
      calculations.previousTimeStamp = Date.now();
      tusUploader.start();
      file.uploadStarted = true;
      file.resume_able = true;
      file.save();
    });
  }
}
