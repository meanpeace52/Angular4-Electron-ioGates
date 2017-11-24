import * as AsyncPolling from 'async-polling';
import { FSWatcher, watch } from 'chokidar';
import { EventEmitter } from 'events';
import {IFile} from '../interfaces/ifile';
import {ILogger} from '../interfaces/ilogger';
import {Files} from '../types/files';
import { File } from '../types/models/file';
import { Share } from '../types/models/share';
import { UploadResponse } from '../types/uploadResponse';
import {Directory} from './directory';
import { Downloader } from './downloader';
import { IOGates } from './iogates';
import { Uploader } from './uploader';
import * as Queue from 'queue';
import Bluebird = require('bluebird');

export class Watcher extends EventEmitter {
  public logger: ILogger;
  protected api: IOGates;
  constructor() {
    super();
  }
  protected info(message: string) {
    if (this.logger) {
      this.logger.info(message);
    }
  }
  protected error(message: string) {
    if (this.logger) {
      this.logger.error(message);
    }
  }
  protected debug(message: string) {
    if (this.logger) {
      this.logger.debug(message);
    }
  }
}

export class DownloadWatcher extends Watcher {

  public downloader: Downloader;
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
      this.api
        .readFiles()
        .then((response: Files) => {
          const files = response.files.map((file: File) => {
            return File.fromPlain(file);
          });

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
                  downloaded: true,
                }, {
                  where: {
                    file_id: successIds,
                  },
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
  private uploader: Uploader;
  private directory: Directory;
  private files: File[];
  private share: Share;
  private watcher: FSWatcher;
  private queue;

  constructor(iogates: IOGates, uploader: Uploader, directory: Directory, threads: number) {
    super();
    this.api = iogates;
    this.uploader = uploader;
    this.directory = directory;
    this.queue = Queue({
      concurrency: 1,
      autostart: true,
    });

    this.watcher = watch(directory.path, {
      awaitWriteFinish: {
        stabilityThreshold: 5000,
        pollInterval: 100,
      },
      ignorePermissionErrors: true,
      persistent: true,
    });
  }

  public watch(share: Share) {
    if (!share.token) {
      this.error('Upload File Watcher: missing share token');
      this.emit('error', new Error('<token> is not available for this share.'));
    }
    this.share = share;

    this.watcher
      .on('add', (path: string) => {
        this.debug(`${path} added`);
        this.queue.push(() => { return this.initiateUpload(); });
      })
      .on('change', (path: string) => {
        this.debug(`${path} changed`);
        this.queue.push(() => { return this.initiateUpload(); });
      })
      .on('addDir', (path: string) => {
        this.debug(`${path} added`);
        this.queue.push(() => { return this.initiateUpload(); });
      });
  }

  private initiateUpload(): Bluebird<void> {
    return this.directory
      .read()
      .then((files: File[]) => {
        this.files = files;

        return files;
      })
      .then(() => {
        return this.api.authenticateFromUrl(this.share);
      })
      .then(() => {
        return File.saveReadStreamFiles(this.files, this.share);
      })
      .then((files: File[]) => {
        this.debug('Going to create files on ioGates.');

        return this.api.createFiles(files);
      })
      .then((files: File[]) => {
        this.debug(`Files created: ${files.length}`);

        return this.uploader.uploadFiles(files, this.share);
      })
      .then((files: File[]) => {
        const successIds = [];

        files.forEach((file: File) => {
          if (file.uploaded) {
            successIds.push(file.file_id);
            this.emit('success', file);
            this.debug(`Success: ${file.name}`);
          } else {
            this.debug(`Failure: ${file.name}`);
          }
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
