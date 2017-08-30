import { demux } from 'muxer';
import * as MultiDownloader from 'mt-downloader';
import { Observable as O } from 'rx';
import * as R from 'ramda';
import * as Type from './types';
import * as Progress from 'progress';
// import * as WebWorker from 'webworker-threads';

/**
 * Helps download a file from IOGates
 */
export class Downloader {

  public downloadFiles(files: Type.File[], dest: string): Promise<Type.UploadResponse[]> {
    const exec = [];
    for (const file of files) {
      exec.push(this.downloadFile(file, dest));
    }

    return Promise.all(exec);
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
    const bar = new Progress(':percent :bar', {
      total: 1000,
      complete: '█',
      incomplete: '░'
    })
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
