import * as AsyncPolling from 'async-polling';
import { Downloader } from './downloader';
import { Share } from '../types/models/share';
import { File } from '../types/models/file';
import {Files} from '../types/files';
import { UploadResponse } from '../types/uploadResponse';
import { IOGates } from './iogates';
import { EventEmitter } from 'events';
import { Uploader } from './uploader';
import {Directory} from './directory';
import { FSWatcher, watch } from 'chokidar';
import {IFile} from './ifile';

export class Watcher extends EventEmitter {

  constructor() {
    super();
  }
}

export class DownloadWatcher extends Watcher {

  public downloader: Downloader;
  private api: IOGates;
  private delay: number;
  constructor(iogates: IOGates, downloader: Downloader, delay?: number) {
    super();
    this.api = iogates;
    this.delay = delay || 6000;
    this.downloader = downloader;
  }

  public watch(share: Share) {
    if (!share.token) {
      this.emit('error', new Error('<token> is not available for this share.'));
    }
    this.api.setToken(share.token);
    const polling = AsyncPolling((end) => {
      // console.log('<checking...>');
      this.api
        .readFiles()
        .then((response: Files) => {
          const files = response.files;

          return File.filterForDownload(files);
        })
        .then((files: File[]) => {
          return this.downloader.setupHierarchy(<IFile[]>files, share.dir);
        })
        .then((files: File[]) => {
          if (files.length === 0) {
            return end();
          }
          // save them in db.

          return File
            .bulkSave(files, share)
            .then((files: File[]) => {
              return this.downloader.downloadFiles(files);
            })
            .then((responses: UploadResponse[]) => {
              const successIds = [];
              responses.forEach((response: UploadResponse) => {
                if (response.success === true) {
                  successIds.push(response.file.file_id);
                }
              });

              return File
                .update({
                  downloaded: true
                }, {
                  where: {
                    file_id: successIds
                  }
                });
            })
            .then(() => {
              end();
            });
        })
        .catch(e => {
          this.emit('error', e);
        });
    }, this.delay);
    polling.on('error', (err) => {
      this.emit('error', err);
    });
    polling.run();
  }
}

export class UploadWatcher extends Watcher {

  private api: IOGates;
  private uploader: Uploader;
  private destination: string;
  private directory: Directory;
  private files: File[];
  private watcher: FSWatcher;

  constructor(destination: string, public threads: number) {
    super();
    this.api = new IOGates();
    this.uploader = new Uploader(threads);
    this.destination = destination;
    this.directory = new Directory(this.destination);
    this.watcher = watch(this.destination, {
      awaitWriteFinish: {
        stabilityThreshold: 5000,
        pollInterval: 100
      },
      ignorePermissionErrors: true,
      persistent: true
    });
  }

  public watch(share: Share) {
    if (!share.token) {
      this.emit('error', new Error('<token> is not available for this share.'));
    }
    this.api.setToken(share.token);

    this.watcher
      .on('add', () => this.initiateUpload(share))
      .on('change', () => this.initiateUpload(share))
      .on('addDir', () => this.initiateUpload(share))

  }

  private initiateUpload(share: Share) {
    this.directory
      .read()
      .then((files: File[]) => {
        this.files = files;

        return files;
      })
      .then(() => {
        this.api.setApiUrlFromShareUrl(share.url);

        return this.api.authenticateFromUrl(share);
      })
      .then(() => {
        return File.saveReadStreamFiles(this.files, share);
      })
      .then((files: File[]) => {
        // winston.info('Going to create files on ioGates.');

        return this.api.createFiles(files);
      })
      .then((files: File[]) => {
        // winston.info(`Files created: ${files.length}`);

        return this.uploader.uploadFiles(files, share);
      })
      .then((files: File[]) => {
        let successIds = [];

        files.forEach((file: File) => {
          if (file.uploaded) {
            successIds.push(file.file_id);
            this.emit('success', file);
          }
          // console.info(`Success(${file.uploaded}): ${file.name}`);
        });

        return Promise.resolve(files);
      })
      .then((files: File[]) => {
        this.emit('success-all', files);
      })
      .catch(e => {
        this.emit('error', e);
      });
  }
}
