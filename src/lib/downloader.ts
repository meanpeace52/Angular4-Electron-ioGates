import { demux } from 'muxer';
import * as MultiDownloader from 'mt-downloader';
import { Observable as O } from 'rx';
import * as R from 'ramda';
import * as Type from './types';
//import * as Progress from 'ascii-progress';
import * as CliProgress from 'cli-progress';
//import * as queue from 'queue';
import * as fs from 'fs';

/**
 * Helps download a file from IOGates
 */
export class Downloader {

  public downloadFiles(files: Type.File[], dest: string): Promise<Type.UploadResponse[]> {
    const self = this;
    return new Promise(async (resolve, reject) => {
      const results = [];
      for (const file of files) {
        try {
          const r: Type.UploadResponse = await self.downloadFile(file, dest);
          results.push(r);
        } catch (err) {
          
        }
      }
      return resolve(results);
    });
  }

  public downloadFile(file: Type.File, dest: string): Promise<Type.UploadResponse> {
    dest = this.getDestination(file, dest);
    const mtdPath : string = MultiDownloader.MTDPath(dest);

    const options = {
      url: file.download,
      path: dest
    };

    let downloadFromMTDFile$;
    if (fs.existsSync(mtdPath)) {
      /**
       * MTD file exists, resume
       */
      downloadFromMTDFile$ = MultiDownloader.DownloadFromMTDFile(mtdPath).share();
    } else {
      /**
       * Create new download
       */
      const createMTDFile$ = this.createDownload(options);

      downloadFromMTDFile$ = createMTDFile$
      .last()
      .map(mtdPath)
      .flatMap(MultiDownloader.DownloadFromMTDFile).share();
    }
    
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
      .withLatestFrom(fdR$)
      .map(R.tail)
      .flatMap(R.map(R.of));

    /*const bar = new Progress({
      schema: `${file.name} [:bar] :percent :elapsed/:eta s`
    });*/
    const bar = new CliProgress.Bar({
      format: `${file.name} [{bar}] {percentage}% | ETA: {eta}s`,
      stopOnComplete: true,
      clearOnComplete: false
    }, CliProgress.Presets.shades_classic);
    bar.start(1, 0);

    MultiDownloader.Completion(meta$).subscribe((i) => bar.update(i));
    const closeFile = MultiDownloader.FILE.close(fd$).last().toPromise();
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
