import { demux } from 'muxer';
import * as MultiDownloader from 'mt-downloader';
import { Observable as O } from 'rx';
import * as R from 'ramda';
import * as Type from './types';

/**
 * Helps download a file from IOGates
 */
export class Downloader {

  // public downloadFiles(files: Type.File[], dest: string) {

  // }

  public downloadFile(file: Type.File, dest: string) {
    // do something.
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

    return MultiDownloader.FILE.close(fd$).toPromise();
  }

  private createDownload(options: object) {
    return MultiDownloader.CreateMTDFile(options).share();
  }
}
