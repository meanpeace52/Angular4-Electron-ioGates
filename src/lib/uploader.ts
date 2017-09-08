import { Upload } from 'tus-js-client';
import * as Type from './types';
import * as CliProgress from 'cli-progress';
import {UploadOptionsExtended} from "../types/uploadOptionExtended";
import {Directory} from "./directory";

// import * as fs from 'fs';


export class Uploader {
  public baseUrl = 'https://share-web02-transferapp.iogates.com/api';
  public token = '';
  public uploadFiles(files: Type.File[], share: Type.Share) {
    const self = this;
    this.token = share.token;
    return new Promise(async (resolve, reject) => {
      const results = [];
      for (const file of files) {
        try {
          const r = await self.uploadFile(file);
          results.push(r);
        } catch (err) {

        }
      }
      return resolve(results);
    });
  }

  public uploadFile(file: Type.File): Promise<any> {

    return new Promise((resolve: Function, reject: Function) => {

      const bar = new CliProgress.Bar({
        format: `[{bar}] {percentage}%`,
        stopOnComplete: true,
        clearOnComplete: false
      }, CliProgress.Presets.shades_classic);

      bar.start(1, 0);

      let uploadOptions: UploadOptionsExtended  = {
        endpoint: `${this.baseUrl}/upload/tus/${this.token}/`,
        uploadUrl: null,
        resume: true,
        retryDelays: [0, 1000, 3000, 5000],
        metadata: {
          filename: file.name,
          uuid: file.uuid
        },
        onError: function(error) {
          tusUploader.abort();
          return reject(error);
        },
        onProgress: function(bytesUploaded, bytesTotal) {
          // let percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
          bar.update(bytesUploaded / bytesTotal);
        },
        onSuccess: function() {
          return resolve({});
          // console.log("Download %s from %s", upload.file.name, upload.url)
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
