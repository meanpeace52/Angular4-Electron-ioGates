import * as Bluebird from 'bluebird';
import { EventEmitter } from 'events';
import {ReadStream} from 'fs';
import * as http from 'http';
import * as _ from 'lodash';
import * as request from 'request';
import { Subject } from 'rx';
import {Error} from 'tslint/lib/error';
import { Upload } from 'tus-js-client';
import {ILogger} from '../interfaces/ilogger';
import {ITusChunkEvent, ITusProgressEvent} from '../types/command_inputs';
import { Chunk } from '../types/models/chunk';
import {IUploadOptionsExtended} from '../types/uploadOptionExtended';
import {Directory} from './directory';
import {Downloader} from './downloader';
import {IOGates} from './iogates';
import * as Type from './types';
import {isArray, isUndefined} from 'util';

export class Uploader extends EventEmitter {
  public static EVENT_START: string = 'start';
  public static EVENT_PROGRESS: string = 'progress';
  public static EVENT_COMPLETE: string = 'complete';
  public static EVENT_FAILURE: string = 'failure';

  public baseUrl: string = 'https://share-web02-transferapp.iogates.com';
  public token: string = '';
  public chunkSize: number = 16777216;
  public concatLimit: number = 10485760;
  public logger: ILogger;

  private threads: number = 1;

  constructor(threads: number) {
    super();
    this.threads = threads;
  }

  public uploadFiles(files: Type.File[], share: Type.Share): Bluebird<Type.File[]> {
    this.token = share.token;
    this.baseUrl = IOGates.GET_BASE_URL(share.url);

    const results = [];

    return new Bluebird(async (resolve: Function) => {
      for (const file of files) {
        // results.push(this.uploadFile(file));
        try {
          const r: Type.File = await this.uploadFile(file);
          results.push(r);
        } catch (err) {
          this.error(`Error uploading ${file.name}. ${err}`);
        }
      }

      return resolve(results);
    });
  }

  public uploadFile(file: Type.File): Bluebird<Type.File> {
    this.emit(Uploader.EVENT_START, file);
    const sentValues = [];
    const sentTimestamps = [];
    const bytesUploaded = {};

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
      const rate = Downloader.CALCULATE_TRANSFER_SPEED(
        sentValues, sentTimestamps, progress >= 1 ? null : 50).toFixed(1);
      this.emit(Uploader.EVENT_PROGRESS, file, progress, Number(rate));
    });

    if (file.size <= this.concatLimit) {
      this.debug('Uploading without concatenation');

      return this.upload(file, barSubject);
    } else {
      if (isUndefined(file.chunks) || (isArray(file.chunks) && file.chunks.length === 0)) {
        this.debug('Creating Chunks');
        const chunks = Chunk.CREATE_CHUNKS(file, this.threads, this.concatLimit);

        return Chunk.STORE_CHUNKS(chunks).then(() => {
          file.chunks = chunks;

          return this.concatUpload(file, barSubject);
        });
      } else {
        this.debug('Chunks are available');

        return this.concatUpload(file, barSubject);
      }
    }
  }
  private upload(file: Type.File, barSubject: Subject): Bluebird<Type.File> {
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
        uuid: file.uuid,
      },
      extensions: {
        concatenation: false,
        checksum: true,
      },
    };

    if (file.upload_started) {
        options.uploadUrl = `${this.baseUrl}/upload/tus/${this.token}/${file.uuid}`;
    }

    return new Bluebird((resolve: Function, reject: Function) => {
      options.onSuccess = () => {
        this.debug(`${file.uuid} uploaded`);
        file.uploaded = true;
        file.upload_started = false;
        file.resume_able = false;

        return resolve(file);
      };
      options.onProgress = (bytesUploaded: number, bytesTotal: number) => {
        barSubject.onNext(<ITusProgressEvent> {
          bytesTotal: bytesTotal,
          bytesUploaded: bytesUploaded,
          chunkId: 0,
        });
      };

      options.onError = (error: Error) => {
        this.emit(Uploader.EVENT_FAILURE, file);
        this.error(error.message);
        this.error(error.stack);
        tusUploader.abort();

        return reject(error);
      };

      const stream = <any> Directory.GET_STREAM(file.stream_path);
      const tusUploader = new Upload(stream, options);

      this.debug(`Starting ${file.uuid}`);
      tusUploader.start();
    }).then((uploadFile: Type.File) => {
      return uploadFile.save().then(() => {
          this.emit(Uploader.EVENT_COMPLETE, file);

          return uploadFile;
      });
    });
  }
  private concatUpload(file: Type.File, barSubject: Subject): Bluebird<Type.File> {
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
        filename: `${file.upload_filename}${file.name.substr(extIndex, file.name.length)}`,
      },
      extensions: {
        concatenation: true,
        checksum: true,
      },
    };

    return new Bluebird((resolve: Function, reject: Function) => {

      const clientSubject: Subject = new Subject<ITusChunkEvent>();
      let counter = 0;
      clientSubject.subscribe((event: ITusChunkEvent) => {
        counter += 1;
        this.debug(`Client created. File offset: ${event.chunk.starting_point}`);

        event.chunk.upload_started = 1;
        event.chunk.resume_url = `${this.baseUrl}/upload/tus/${this.token}/${event.chunk.uuid}`;
        event.chunk.save();

        if (counter === this.threads) {
          file.upload_started = true;
          file.resume_able = true;
          file.save()
            .then(() => this.info(`Resuming state saved for file: ${file.name}`));
        }
      }, (error: Error) => {
        this.error(error.message);
        this.error(error.stack);
      }, () => {
        this.debug('Completed creating clients');
      });

      const clientPromises = [];

      const nonUploadedChunks = _.filter(file.chunks, { uploaded: false });
      this.debug(`Incomplete chunks: ${nonUploadedChunks.length}`);

      const stream = <ReadStream> Directory.GET_STREAM(file.stream_path);
      for (const chunk of nonUploadedChunks) {
        this.debug(
          `Adding client with offset ${chunk.offset}, ` +
          `starting point in local file: ${chunk.starting_point}, chunk id ${chunk.id}`,
        );
        clientPromises.push(this.createUploadClient(stream, chunk, uploadOptions, barSubject, clientSubject));
      }

      this.debug(`Upload clients: ${clientPromises.length}`);

      Bluebird.all(clientPromises)
        .then((chunks: Chunk[]) => {
          this.debug('Uploading done');
          chunks.sort((a: Chunk, b: Chunk) => { return (a.starting_point <= b.starting_point ? -1 : 1); });
          const fileUrls = chunks.map((chunk: Chunk) => `${chunk.resume_url}`).join(' ').trim();
          const req = request.defaults({
            baseUrl: this.baseUrl,
          });
          req.post({
            url: `/upload/tus/${this.token}`,
            headers: {
              'Tus-Resumable': '1.0.0',
              'Upload-Concat': `final;${fileUrls}`,
            },
          }, (err: any, r: http.IncomingMessage) => {
            if (r.statusCode !== 201) {
              this.error(`Failed finalizing file. Error: ${err}. File urls: ${fileUrls}`);

              return reject(err);
            }

            Chunk.BulkSave(chunks)
              .then(() => {
                file.uploaded = true;
                file.upload_started = false;

                return file.save();
              })
              .then((f: Type.File) => {
                this.emit(Uploader.EVENT_COMPLETE, file);
                this.debug(`Upload completed successfully for file: ${file.name}`);

                return resolve(f);
              });
          });
        });
    });
  }
  private createUploadClient(
    stream: any,
    chunk: Chunk,
    extOptions: IUploadOptionsExtended,
    barSubject: Subject,
    chunkSubject: Subject): Bluebird<Chunk> {

    const options = Object.assign({}, extOptions);

    if (chunk.upload_started) {
      options.uploadUrl = `${this.baseUrl}/upload/tus/${this.token}/${chunk.uuid}`;
    }

    return new Bluebird((resolve: Function, reject: Function) => {
      options.metadata.uuid = chunk.uuid;
      options.uploadSize = chunk.size;
      options.fileOffset = chunk.starting_point;
      options.onSuccess = () => {
        this.debug(`${chunk.uuid} uploaded`);
        chunk.uploaded = true;
        chunk.upload_started = 0;

        return resolve(chunk);
      };
      options.onProgress = (bytesUploaded: number, bytesTotal: number) => {
        barSubject.onNext(<ITusProgressEvent> {
          bytesTotal: bytesTotal,
          bytesUploaded: bytesUploaded,
          chunkId: chunk.id,
        });
      };

      options.onError = (error: Error) => {
        this.error(error.message);
        this.error(error.stack);
        tusUploader.abort();

        return reject(error);
      };

      const tusUploader = new Upload(stream, options);

      this.debug(`Starting ${chunk.uuid}`);
      tusUploader.start();

      chunkSubject.onNext(<ITusChunkEvent>{chunk: chunk});
    });
  }

  private info(message: string) {
    if (this.logger) {
      this.logger.info(message);
    }
  }
  private error(message: string) {
    if (this.logger) {
      this.logger.error(message);
    }
  }
  private debug(message: string) {
    if (this.logger) {
      this.logger.debug(message);
    }
  }
}
