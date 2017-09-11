import { Upload } from 'tus-js-client';
import * as Type from './types';
import * as CliProgress from 'cli-progress';
import {UploadOptionsExtended} from "../types/uploadOptionExtended";
import {Directory} from "./directory";
import {IOGates} from './iogates';
import * as winston from 'winston';
import * as _ from 'lodash';
// import * as fs from 'fs';


export class Uploader {
  public baseUrl = 'https://share-web02-transferapp.iogates.com';
  public token = '';
  public uploadFiles(files: Type.File[], share: Type.Share): Promise<Array<Type.File>> {
    this.token = share.token;
    this.baseUrl = IOGates.getBaseUrlFromShareUrl(share.url);
    // let self = this;
    const results = [];
    for (const file of files) {
      results.push(this.uploadFile(file));
    }
    return Promise.all(results)
      .then(files => files);
    // return new Promise(async (resolve, reject) => {
    //   for (const file of files) {
    //     results.push(this.uploadFile(file));
        // try {
        //   const r: Type.File = await self.uploadFile(file);
        //   results.push(r);
        // } catch (err) {
        //
        // }
      // }
      // return resolve(results)
    // });
  }

  public uploadFile(file: Type.File): Promise<Type.File> {

    return new Promise((resolve: Function, reject: Function) => {
      let extIndex = _.lastIndexOf(file.name, '.');
      const bar = new CliProgress.Bar({
        format: `${file.name} [{bar}] {percentage}% | ETA: {eta}s`,
        stopOnComplete: true,
        clearOnComplete: false,
        etaBuffer: 20,
        fps: 5
      }, CliProgress.Presets.shades_classic);

      bar.start(100, 0);

      let uploadOptions: UploadOptionsExtended  = {
        endpoint: `${this.baseUrl}/upload/tus/${this.token}/`,
        uploadUrl: null,
        uploadSize: file.size,
        resume: true,
        chunkSize: 1000000,
        retryDelays: [0, 1000, 3000, 5000],
        metadata: {
          filename: `${file.upload_filename}${file.name.substr(extIndex, file.name.length)}`,
          uuid: file.uuid
        },
        onError: function(error) {
          winston.info(`error occured: ${JSON.stringify(error)}`);

          tusUploader.abort();
          return reject(error);
        },
        onProgress: function(bytesUploaded, bytesTotal) {
          let percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
          bar.update(percentage);
        },
        onSuccess: function() {
          file.uploaded = true;
          file.save()
            .then(file => {
              return resolve(file);
            });
        }
      };

      if(file.uploadStarted) {
        uploadOptions.uploadUrl = `${this.baseUrl}/upload/tus/${this.token}/${file.uuid}`;
      }

      let stream = <any> Directory.getStream(file.stream_path);
      let tusUploader = new Upload(stream, uploadOptions);
      tusUploader.start();
      file.uploadStarted = true;
      file.resume_able = true;
      file.save();
    });



  }


}
