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
import { Chunk } from "../types/models/chunk";

export class Uploader {
  public baseUrl: string = 'https://share-web02-transferapp.iogates.com';
  public token: string = '';

  constructor(public ioGatesInstance: IOGates, public threads: number) { }

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
          filename: `${file.upload_filename}${file.name.substr(extIndex, file.name.length)}`
        },
        extension: {
          concatenation: true
        }
      };

      if (file.upload_started) {
        uploadOptions.uploadUrl = `${this.baseUrl}/upload/tus/${this.token}/${file.uuid}`;
      }
      const stream = <any> Directory.getStream(file.stream_path);

      let clientSubject: Subject = new Subject<boolean>();

      let clientPromises = [];

      let clientGenerator: IterableIterator<Promise<any>> = CreateTusUploadClient(
        stream, uploadOptions, barSubject, file, clientSubject
      );


      while(!clientGenerator.next().done) {
        clientPromises.push(clientGenerator.next().value);
      }

      Promise.all(clientPromises)
        .then((chunks: Array<Chunk>) => {
          this.ioGatesInstance.getRequest().post({
            url: '/files',
            headers: {
              'Upload-Concat': `final;${chunks.map(chunk => `${chunk.resume_url}`).join(' ').trim()}`
            }
          }, (err: Error, r: http.IncomingMessage, response: any) => {
            if (r.statusCode !== 200) {
              return reject(err);
            }

            Chunk.BulkSave(chunks)
              .then(() => {
                file.uploaded = true;
                return file.save();
              })
              .then((f: Type.File) => {
                logger.info(`Upload completed successfully for file: ${file.name}`);
                return resolve(f);
              });
          });
        });

      let clientSubscriber = clientSubject.subscribe((response: any) => {
        let { chunk, counter } = response;

        chunk.upload_started = true;
        chunk.resume_url = `${this.baseUrl}/upload/tus/${this.token}/${chunk.uuid}`;
        chunk.save();

        if (counter === this.threads) {
          file.upload_started = true;
          file.resume_able = true;
          file.save()
            .then(() => logger.info(`Resuming state saved for file: ${file.name}`));
          clientSubscriber.unsubscribe();
        }
      });

    });
  }
}

function* CreateTusUploadClient(
  stream: any,
  options: UploadOptionsExtended,
  barSubject: Subject,
  file: Type.File,
  chunkSubject: Subject): IterableIterator<Promise<Array<string>>> {

  let logger = global['logger'];
  let counter = 0;
  let chunk = file.chunks[counter];
  let source = getSource(stream, file.chunkSize);
  let slicedSource = source.slice(chunk.starting_point, chunk.ending_point);


  if(chunk.starting_point < file.size && chunk.ending_point <= file.size && !chunk.uploaded) {
    /*yield*/

    yield new Promise((resolve: Function, reject: Function) => {

      counter += 1;
      options.metadata.uuid = chunk.uuid;
      options.onSuccess = () => resolve(chunk);
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

      chunkSubject.onNext({ chunk, counter });

    });
  }
}