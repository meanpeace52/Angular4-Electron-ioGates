import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as MultiDownloader from 'mt-downloader';
import { demux } from 'muxer';
import * as R from 'ramda';
import { Observable as O } from 'rx';
import { isUndefined } from 'util';
import { Directory } from './directory';
import { DownloadActivity } from './downloadActivity';
import { IFile } from './ifile';
import { ILogger } from './ilogger';
import * as Type from './types';

/**
 * Helps download a file from IOGates
 */
export class Downloader extends EventEmitter {
  public static EVENT_START: string = 'start';
  public static EVENT_PROGRESS: string = 'progress';
  public static EVENT_COMPLETE: string = 'complete';
  public static EVENT_FAILURE: string = 'failure';

  public startDate: Date | undefined;
  public activityChannel: string | undefined;

  public logger: ILogger;

  public static CALCULATE_TRANSFER_SPEED(sent: number[], timestamps: number[], buffer: number | null = null) {
    const sentLen = sent.length;
    const timeLen = timestamps.length;
    if (sentLen === 0 || timeLen === 0 || sentLen !== timeLen) {
      return 0;
    }
    const lastIdx = sentLen - 1;
    let bytes;
    let ms;
    if (buffer === null) {
      bytes = sent[lastIdx] - sent[0];
      ms = timestamps[lastIdx] - timestamps[0];
    } else {
      let bufferIdx = lastIdx - buffer;
      if (bufferIdx < 0) {
        bufferIdx = 0;
      }
      bytes = (sent[lastIdx] - sent[bufferIdx]);
      ms = (timestamps[lastIdx] - timestamps[bufferIdx]);
    }
    if (ms === 0) {
      return 0;
    }

    return (bytes / 1048576) / (ms / 1000);
  }

  public downloadFiles(files: IFile[]): Promise<Type.UploadResponse[]> {
    return new Promise(async (resolve: Function) => {
      const results = [];
      const fileSavePromises = [];
      for (const file of files) {
        try {
          if (isUndefined(this.startDate) || file.created > this.startDate) {
            const r: Type.UploadResponse = await this.downloadFile(file);
            results.push(r);
            r.file.downloaded = true;
            fileSavePromises.push(r.file.save());
          } else {
            this.info(`Ignoring ${file.name} as it is older than start date`);
          }
        } catch (err) {
          this.error(`Failed downloading: ${file.name}. ${err}`);
        }
      }

      return Promise.all(fileSavePromises).then(() => {
        return resolve(results);
      });
    });
  }

  public downloadFile(file: IFile): Promise<Type.UploadResponse> {
    this.emit(Downloader.EVENT_START, file);
    if (!file.destination) {
      throw new Error('Destination is empty');
    }
    if (!file.download) {
      throw new Error('Download url is empty');
    }

    const uploadResponse: Type.UploadResponse = new Type.UploadResponse();
    uploadResponse.dest = file.destination;
    uploadResponse.success = false;
    uploadResponse.file = file;
    const downloadActivity = new DownloadActivity(this.activityChannel);

    return downloadActivity
      .attachFile(file)
      .onceReady()
      .then(() => {
        try {
          const mtdPath: string = MultiDownloader.MTDPath(file.destination);
          const options = {
            url: file.download,
            path: file.destination,
          };

          const sentValues = [];
          const sentTimestamps = [];

          let downloadFromMTDFile$;
          if (fs.existsSync(mtdPath)) {
            /**
             * MTD file exists, resume
             */
            this.info(`resume ${file.destination}`);
            downloadActivity.resume();
            downloadFromMTDFile$ = MultiDownloader.DownloadFromMTDFile(mtdPath).share();
          } else {
            /**
             * Create new download
             */
            this.info(`download ${file.destination}`);
            const createMTDFile$ = this.createDownload(options);

            downloadActivity.start();
            downloadFromMTDFile$ = createMTDFile$
              .last()
              .map(mtdPath)
              .flatMap(MultiDownloader.DownloadFromMTDFile).share();
          }
          const [{fdR$, meta$}] = demux(downloadFromMTDFile$, 'fdR$', 'meta$');
          /**
           * Finalize Downloaded FILE
           */
          const finalizeDownload$ = downloadFromMTDFile$.last()
            .withLatestFrom(fdR$, meta$, (_: {}, fd: {}, meta: {}) => ({
              fd$: O.just(fd),
              meta$: O.just(meta),
            }))
            .flatMap(MultiDownloader.FinalizeDownload)
            .share()
            .last()
            .catch((err: any) => {
              this.error(`downloadFromMTDFile$ error: ${err}`);
            });
          /**
           * Close File Descriptors
           */
          const fd$ = finalizeDownload$
            .withLatestFrom(fdR$)
            .map(R.tail)
            .flatMap(R.map(R.of))
            .catch((err: any) => {
              this.error(`finalizeDownload$ error: ${err}`);
            });
          const closeFile = MultiDownloader.FILE.close(fd$).last().toPromise();

          this.downloaded(meta$).subscribe((d: number) => {
            sentValues.push(d);
            sentTimestamps.push(+new Date());
          });

          MultiDownloader.Completion(meta$).subscribe((i: number) => {
            const speed = Downloader.CALCULATE_TRANSFER_SPEED(
              sentValues, sentTimestamps, i === 1 ? null : 50).toFixed(1);
            const percent = i * 100;
            this.emit(Downloader.EVENT_PROGRESS, file, i, Number(speed));
            downloadActivity.progress(percent, Number(speed));
          });

          return closeFile;
        } catch (err) {
          this.error(`${err}`);
          throw err;
        }
      })
      .then(() => {
        this.emit(Downloader.EVENT_COMPLETE, file);
        downloadActivity.completed();
        uploadResponse.success = true;
        this.info(`Completed: ${file.destination}`);

        return uploadResponse;
      }, (reason: any) => {
        this.emit(Downloader.EVENT_FAILURE, file);
        this.error(`Error downloading ${file.destination}`);
        this.error(reason);
        downloadActivity.failed(reason);
        uploadResponse.success = false;

        return uploadResponse;
      });
  }

  public downloaded: O = (m: O) => {
    return m.map((meta: MultiDownloader.meta$) => {
      return R.sum(meta.offsets) - R.sum(R.map(R.nth(0), meta.threads)) + R.length(meta.threads) - 1;
    });
  }

  public setupHierarchy(entries: IFile[], destination: string) {
    const tree = new Map();
    const files = [];
    const dirs = [];
    for (const entry of entries.filter(Boolean)) {
      entry.destination = this.location(entry, destination, tree);
      tree.set(entry.file_id, entry);
      if (entry.isDirectory()) {
        const dir = new Directory(entry.destination);
        dirs.push(dir.create());
        continue;
      }
      files.push(entry);
    }

    return Promise
      .all(dirs)
      .then(() => {
        return files;
      });
  }

  private location(file: IFile, destination: string, tree: Map<number, object>) {
    if (!file.parent) {
      return [destination, file.name].join('/');
    }
    const parent = <IFile>tree.get(+file.parent);
    let path = this.location(parent, destination, tree);
    if (parent.type === 'dir') {
      path = [path, file.name].join('/');
    } else {
      path = path.split('/');
      path.pop();
      path.push(file.name);
      path = path.join('/');
    }

    return path;
  }

  private createDownload(options: object) {
    return MultiDownloader.CreateMTDFile(options).share();
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
}
