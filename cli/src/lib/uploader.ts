import { Upload } from 'tus-js-client';
import * as Type from './types';
import * as CliProgress from 'cli-progress';
import {IUploadOptionsExtended} from '../types/uploadOptionExtended';
import {Directory} from './directory';
import {ReadStream} from 'fs';
import {IOGates} from './iogates';
import * as _ from 'lodash';
import {Downloader} from './downloader';
import {Error} from 'tslint/lib/error';
//import {getSource} from './source';
import { Subject } from 'rx';
import {ITusChunkEvent, ITusProgressEvent} from '../types/command_inputs';
import * as http from 'http';
import * as request from 'request';
import { Chunk } from '../types/models/chunk';
import {isUndefined} from 'util';
import * as Bluebird from 'bluebird';

export class Uploader {
  public baseUrl: string = 'https://share-web02-transferapp.iogates.com';
  public token: string = '';
  public chunkSize: number = global['config'].upload.chunkSize || 16777216;
  private threads: number = 1;

  constructor(threads: number) {
    this.threads = threads;
  }

  public uploadFiles(files: Type.File[], share: Type.Share): Bluebird<Type.File[]> {
    this.token = share.token;
    this.baseUrl = IOGates.GET_BASE_URL(share.url);

    const results = [];
    // for (const file of files) {
    //   results.push(this.uploadFile(file));
    // }
    // return Promise.all(results)
    //   .then(files => files);

    return new Bluebird(async (resolve: Function, reject: Function) => {
      for (const file of files) {
        // results.push(this.uploadFile(file));
        try {
          const r: Type.File = await this.uploadFile(file);
          results.push(r);
        } catch (err) {
          global['logger'].error(err.message);
          global['logger'].error(err.stack);
        }
      }

      return resolve(results);
    });
  }

  public uploadFile(file: Type.File): Bluebird<Type.File> {
    const sentValues = [];
    const sentTimestamps = [];
    const bytesUploaded = {};

    const bar = this.createProgressBar(file);
    bar.start(100, 0);

    const barSubject: Subject<ITusProgressEvent> = new Subject<ITusProgressEvent>();

    barSubject.subscribe((event: ITusProgressEvent) => {
      sentTimestamps.push(+ new Date());
      bytesUploaded[event.chunkId] = event.bytesUploaded;
      let totalUploaded = 0;
      Object.keys(bytesUploaded).forEach((key: string) => {
        totalUploaded += +(bytesUploaded[key]);
      });
      sentValues.push(totalUploaded);
      const progress = totalUploaded / file.size;
      const percentage = (progress * 100).toFixed(2);
      const rate = Downloader.CALCULATE_TRANSFER_SPEED(sentValues, sentTimestamps, progress >= 1 ? null : 50);

      bar.update(percentage, {
        speed: `${rate.toFixed(1)} MB/s`
      });
    });

    if (file.size < 1048576) {
      return this.upload(file, barSubject);
    } else {
      if (isUndefined(file.chunks)) {
        const chunks = Chunk.CREATE_CHUNKS(file, this.threads);

        return Chunk.STORE_CHUNKS(chunks).then(() => {
          file.chunks = chunks;

          return this.concatUpload(file, barSubject);
        });
      } else {
        return this.concatUpload(file, barSubject);
      }
    }
  }
  private upload(file: Type.File, barSubject: Subject): Bluebird<Type.File> {
    const logger = global['logger'];
    const extIndex = _.lastIndexOf(file.name, '.');
    const options: IUploadOptionsExtended  = {
      endpoint: `${this.baseUrl}/upload/tus/${this.token}`,
      uploadUrl: null,
      uploadSize: file.size,
      fileOffset: 0,
      resume: true,
      chunkSize: this.chunkSize,
      retryDelays: [0, 1000, 3000, 5000],
      metadata: {
        filename: `${file.upload_filename}${file.name.substr(extIndex, file.name.length)}`,
        uuid: file.uuid
      },
      extensions: {
        concatenation: false,
        checksum: true
      }
    };

    if (file.upload_started) {
        options.uploadUrl = `${this.baseUrl}/upload/tus/${this.token}/${file.uuid}`;
    }

    return new Bluebird((resolve: Function, reject: Function) => {
      options.onSuccess = () => {
        logger.info(`${file.uuid} uploaded`);
        file.uploaded = true;
        file.upload_started = false;
        file.resume_able = false;

        return resolve(file);
      };
      options.onProgress = (bytesUploaded: number, bytesTotal: number) => {
        barSubject.onNext(<ITusProgressEvent> {
          bytesTotal: bytesTotal,
          bytesUploaded: bytesUploaded,
          chunkId: 0
        });
      };

      options.onError = (error: Error) => {
        logger.error(error.message);
        logger.error(error.stack);
        tusUploader.abort();

        return reject(error);
      };

      const stream = <any> Directory.getStream(file.stream_path);
      const tusUploader = new Upload(stream, options);

      logger.info(`Starting ${file.uuid}`);
      tusUploader.start();
    }).then((uploadFile: Type.File) => {
      return uploadFile.save().then(() => {
          return uploadFile;
      });
    });
  }
  private concatUpload(file: Type.File, barSubject: Subject): Bluebird<Type.File> {
    const logger = global['logger'];
    const extIndex = _.lastIndexOf(file.name, '.');
    const uploadOptions: IUploadOptionsExtended  = {
      endpoint: `${this.baseUrl}/upload/tus/${this.token}`,
      uploadUrl: null,
      uploadSize: file.size,
      fileOffset: 0,
      resume: true,
      chunkSize: this.chunkSize,
      retryDelays: [0, 1000, 3000, 5000],
      metadata: {
        filename: `${file.upload_filename}${file.name.substr(extIndex, file.name.length)}`
      },
      extensions: {
        concatenation: true,
        checksum: true
      }
    };

    return new Bluebird((resolve: Function, reject: Function) => {

      const clientSubject: Subject = new Subject<ITusChunkEvent>();
      let counter = 0;
      clientSubject.subscribe((event: ITusChunkEvent) => {
        counter += 1;
        logger.info(`Client created. File offset: ${event.chunk.starting_point}`);

        event.chunk.upload_started = 1;
        event.chunk.resume_url = `${this.baseUrl}/upload/tus/${this.token}/${event.chunk.uuid}`;
        event.chunk.save();

        if (counter === this.threads) {
          file.upload_started = true;
          file.resume_able = true;
          file.save()
            .then(() => logger.info(`Resuming state saved for file: ${file.name}`));
        }
      }, (error: Error) => {
        logger.error(error.message);
        logger.error(error.stack);
      }, () => {
        logger.info('Completed creating clients');
      });

      const clientPromises = [];

      const nonUploadedChunks = _.filter(file.chunks, { uploaded: false });
      logger.info(`Incomplete chunks: ${nonUploadedChunks.length}`);

      const stream = <ReadStream> Directory.getStream(file.stream_path);
      for (const chunk of nonUploadedChunks) {
        logger.info(
          `Adding client with offset ${chunk.offset}, ` +
          `starting point in local file: ${chunk.starting_point}, chunk id ${chunk.id}`
        );
        clientPromises.push(this.createUploadClient(stream, chunk, uploadOptions, barSubject, clientSubject));
      }

      logger.info(`Promise: ${clientPromises.length}`);

      Bluebird.all(clientPromises)
        .then((chunks: Chunk[]) => {
          logger.info('Uploading done');
          chunks.sort((a: Chunk, b: Chunk) => { return (a.starting_point <= b.starting_point ? -1 : 1); });
          const fileUrls = chunks.map((chunk: Chunk) => `${chunk.resume_url}`).join(' ').trim();
          const req = request.defaults({
            baseUrl: this.baseUrl
          });
          req.post({
            url: `/upload/tus/${this.token}`,
            headers: {
              'Tus-Resumable': '1.0.0',
              'Upload-Concat': `final;${fileUrls}`
            }
          }, (err, r: http.IncomingMessage, response: any) => {
            if (r.statusCode !== 201) {
              logger.error(`Failed finalizing file. Error: ${err}. File urls: ${fileUrls}`);

              return reject(err);
            }

            Chunk.BulkSave(chunks)
              .then(() => {
                file.uploaded = true;
                file.upload_started = false;

                return file.save();
              })
              .then((f: Type.File) => {
                logger.info(`Upload completed successfully for file: ${file.name}`);

                return resolve(f);
              });
          });
        });
    });
  }
  private createProgressBar(file: Type.File) {
    return new CliProgress.Bar({
      format: `${file.name} \t [{bar}] {percentage}% | ETA: {eta}s | Speed: {speed}`,
      stopOnComplete: true,
      clearOnComplete: false,
      etaBuffer: 20,
      fps: 5,
      payload: {speed: 'N/A'}
    }, CliProgress.Presets.shades_classic);
  }
  private createUploadClient(
    stream: any,
    chunk: Chunk,
    extOptions: IUploadOptionsExtended,
    barSubject: Subject,
    chunkSubject: Subject): Bluebird<Chunk> {

    const logger = global['logger'];
    const options = Object.assign({}, extOptions);

    if (chunk.upload_started) {
      options.uploadUrl = `${this.baseUrl}/upload/tus/${this.token}/${chunk.uuid}`;
    }

    return new Bluebird((resolve: Function, reject: Function) => {
      options.metadata.uuid = chunk.uuid;
      options.uploadSize = chunk.size;
      options.fileOffset = chunk.starting_point;
      options.onSuccess = () => {
        logger.info(`${chunk.uuid} uploaded`);
        chunk.uploaded = true;
        chunk.upload_started = 0;

        return resolve(chunk);
      };
      options.onProgress = (bytesUploaded: number, bytesTotal: number) => {
        barSubject.onNext(<ITusProgressEvent> {
          bytesTotal: bytesTotal,
          bytesUploaded: bytesUploaded,
          chunkId: chunk.id
        });
      };

      options.onError = (error: Error) => {
        logger.error(error.message);
        logger.error(error.stack);
        tusUploader.abort();

        return reject(error);
      };

      const tusUploader = new Upload(stream, options);

      logger.info(`Starting ${chunk.uuid}`);
      tusUploader.start();

      chunkSubject.onNext(<ITusChunkEvent>{chunk: chunk});
    });
  }
}
