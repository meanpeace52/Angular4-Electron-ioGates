import * as AsyncPolling from 'async-polling';
import { Downloader } from './downloader';
import { Share } from '../types/models/share';
import { File } from '../types/models/file';
import { Files } from '../types/files';
import { UploadResponse } from '../types/uploadResponse';
import { IOGates } from './iogates';
import {
  EventEmitter
} from 'events';
export class Watcher extends EventEmitter {

  constructor() {
    super();
  }
}

export class DownloadWatcher extends Watcher {

  api: IOGates;
  delay: number;
  downloader: Downloader;
  destination: string;
  constructor(destination: string, delay?: number) {
    super();
    this.api = new IOGates();
    this.delay = delay || 6000;
    this.downloader = new Downloader();
    this.destination = destination;
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
                    fileId: successIds
                  }
                });
            })
            .then(() => {
              end();
            })
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