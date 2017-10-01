import { Upload } from 'tus-js-client';
import * as Type from './types';
import * as CliProgress from 'cli-progress';
import {UploadOptionsExtended} from '../types/uploadOptionExtended';
import {Directory} from './directory';
import {IOGates} from './iogates';
import * as _ from 'lodash';
import {Downloader} from './downloader';
import {Error} from 'tslint/lib/error';
import {getSource} from "./source";
import { Subject } from 'rx';
import {TusProgressEvent} from "../types/command_inputs";
import * as http from "http";

export class Uploader {
  public baseUrl: string = 'https://share-web02-transferapp.iogates.com';
  public token: string = '';

  constructor(public ioGatesInstance: IOGates) { }

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
    const sentValues = [];
    const sentTimestamps = [];

    return new Promise((resolve: Function, reject: Function) => {
      const extIndex = _.lastIndexOf(file.name, '.');
      const bar = new CliProgress.Bar({
        format: `${file.name} \t [{bar}] {percentage}% | ETA: {eta}s | Speed: {speed}`,
        stopOnComplete: true,
        clearOnComplete: false,
        etaBuffer: 20,
        fps: 5,
        payload: {speed: 'N/A'}
      }, CliProgress.Presets.shades_classic);

      bar.start(100, 0);

      let barSubject: Subject<TusProgressEvent> = new Subject<TusProgressEvent>();

      barSubject.subscribe((event: TusProgressEvent) => {
        sentValues.push(event.bytesUploaded);
        sentTimestamps.push(+ new Date());
        const progress = event.bytesUploaded / event.bytesTotal;
        const percentage = (progress * 100).toFixed(2);
        const rate = Downloader.CALCULATE_TRANSFER_SPEED(sentValues, sentTimestamps, progress >= 1 ? null : 10);

        bar.update(percentage, {
          speed: `${rate.toFixed(1)} MB/s`
        });
      });

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
        extension: {
          concatenation: true
        }
      };

      if (file.upload_started) {
        uploadOptions.uploadUrl = `${this.baseUrl}/upload/tus/${this.token}/${file.uuid}`;
      }
      const stream = <any> Directory.getStream(file.stream_path);

      let clientsSize = Math.ceil(file.size / 3);
      let fileSubject: Subject = new Subject<boolean>();


      let clientGenerator: IterableIterator<Promise<any>> = CreateTusUploadClient(
        stream, clientsSize, uploadOptions, barSubject, file.size, fileSubject
      );

      let clientPromises = [
        clientGenerator.next().value,
        clientGenerator.next().value,
        clientGenerator.next().value
      ];

      Promise.all(clientPromises)
        .then((uploadedClientFileNames: Array<string>) => {
          this.ioGatesInstance.getRequest().post({
            url: '/files',
            headers: {
              'Upload-Concat': `final;${uploadedClientFileNames.map(name => `/files/${name}`).join(' ').trim()}`
            }
          }, (err: Error, r: http.IncomingMessage, response: any) => {
            if (r.statusCode !== 200) {
              return reject(err);
            }

            file.uploaded = true;
            file.save()
              .then((f: Type.File) => {
                logger.info(`Upload completed successfully for file: ${file.name}`);
                return resolve(f);
              });
          });

        });


      let fileSubscriber = fileSubject.subscribe(() => {
        file.upload_started = true;
        file.resume_able = true;
        file.save()
          .then(() => logger.info(`Resuming state saved for file: ${file.name}`));
        fileSubscriber.unsubscribe();
      });

    });
  }
}

function* CreateTusUploadClient(
  stream: any,
  chunkSize: number,
  options: UploadOptionsExtended,
  barSubject: Subject,
  size: number,
  fileSubject: Subject): IterableIterator<Promise<Array<string>>> {

  let logger = global['logger'];
  let start: number = 0;
  let end: number = start + chunkSize;
  let source = getSource(stream, chunkSize);
  let slicedSource = source.slice(start, end);
  start = chunkSize;
  end = start + chunkSize;

  if(start !== size) {
    /*yield*/

    yield new Promise((resolve: Function, reject: Function) => {

      options.onSuccess = () => resolve((<any> options.metadata).filename);

      options.onProgress = (bytesUploaded: number, bytesTotal: number) => {
        barSubject.onNext(<TusProgressEvent> {
          bytesTotal: bytesTotal,
          bytesUploaded: bytesUploaded
        });
      };

      options.onError = (error: Error) => {
        logger.error(JSON.stringify(error));
        tusUploader.abort();

        return reject(error);
      };

      let tusUploader = new Upload(slicedSource, options);

      tusUploader.start();

      fileSubject.onNext(true);
    });
  }
}