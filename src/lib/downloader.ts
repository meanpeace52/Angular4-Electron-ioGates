import { demux } from 'muxer';
import * as MultiDownloader from 'mt-downloader';
import { Observable as O } from 'rx';
import * as R from 'ramda';
import * as Type from './types';
import * as Progress from 'ascii-progress';
import * as queue from 'queue';

/**
 * Helps download a file from IOGates
 */
export class Downloader {

  public downloadFiles(files: Type.File[], dest: string): Promise<Type.UploadResponse[]> {
    const self = this;
    return new Promise((resolve, reject) => {
      const q = queue();
      const results = [];
      for (const file of files) {
        q.push(function queueFn() {
          return self
            .downloadFile(file, dest)
            .then((r: Type.UploadResponse) => {
              results.push(r);
              return r;
            });
        });
      }

      q.start(function startFn(err) {
        if (err) return reject(err);
        return resolve(results);
      });

    });
  }

  public downloadFile(file: Type.File, dest: string): Promise<Type.UploadResponse> {
    dest = this.getDestination(file, dest);

    const options = {
      url: file.download,
      path: dest
    };

    const createMTDFile$ = this.createDownload(options);
    const [{ fdW$ }] = demux(createMTDFile$, 'fdW$');

    /**
     * Download From MTD File
     */
    const downloadFromMTDFile$ = createMTDFile$
      .last()
      .map(MultiDownloader.MTDPath(options.path))
      .flatMap(MultiDownloader.DownloadFromMTDFile).share();

    const [{ fdR$, meta$ }] = demux(downloadFromMTDFile$, 'meta$', 'fdR$');

    /**
     * Finalize Downloaded FILE
     */
    const finalizeDownload$ = downloadFromMTDFile$.last()
      .withLatestFrom(fdR$, meta$, (_: {}, fd: {}, meta: {}) => ({
        fd$: O.just(fd),
        meta$: O.just(meta)
      }))
      .flatMap(MultiDownloader.FinalizeDownload)
      .share()
      .last();

    /**
     * Close File Descriptors
     */
    const fd$ = finalizeDownload$
      .withLatestFrom(fdW$, fdR$)
      .map(R.tail)
      .flatMap(R.map(R.of));
    const bar = new Progress();
    MultiDownloader.Completion(meta$).subscribe((i) => bar.update(i))
    const closeFile = MultiDownloader.FILE.close(fd$).toPromise();
    const uploadResponse: Type.UploadResponse = new Type.UploadResponse();

    return uploadResponse.fromPromise(closeFile, file, dest);
  }

  private createDownload(options: object) {
    return MultiDownloader.CreateMTDFile(options).share();
  }

  private getDestination(file: Type.File, destination: string): string {
    if (destination.indexOf('.') === -1) {
      destination += `/${file.name}`;
    }

    return destination;
  }
}
