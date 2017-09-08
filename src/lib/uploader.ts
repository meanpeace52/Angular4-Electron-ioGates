import { Upload } from 'tus-js-client';
// import * as Type from './types';
import * as CliProgress from 'cli-progress';
import * as File from 'vinyl';
// import * as fs from 'fs';


export class Uploader {
  public baseUrl = 'https://share-web02-transferapp.iogates.com/api';
  public uploadFiles(files: File[]) {
    const self = this;
    return new Promise(async (resolve, reject) => {
      const results = [];
      for (const file of files) {
        try {
          console.log(file);
          const r = await self.uploadFile(file);
          results.push(r);
        } catch (err) {

        }
      }
      return resolve(results);
    });
  }

  public uploadFile(file: any): Promise<any> {

    return new Promise((resolve: Function, reject: Function) => {

      const bar = new CliProgress.Bar({
        format: `[{bar}] {percentage}%`,
        stopOnComplete: true,
        clearOnComplete: false
      }, CliProgress.Presets.shades_classic);

      bar.start(1, 0);

      let tusUploader = new Upload(file, {
        endpoint: 'https://master.tus.io/files//',//`${this.baseUrl}/file`,
        resume: true,
        retryDelays: [0, 1000, 3000, 5000],
        onError: function(error) {
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
      });



      tusUploader.start();
    });



  }


}
