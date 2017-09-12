import { demux } from 'muxer';
import * as MultiDownloader from 'mt-downloader';
import { Observable as O } from 'rx';
import * as R from 'ramda';
import * as Type from './types';
//import * as Progress from 'ascii-progress';
import * as CliProgress from 'cli-progress';
//import * as queue from 'queue';
import * as fs from 'fs';
import { Directory } from '../lib/directory';

/**
 * Helps download a file from IOGates
 */
export class Downloader {

  public downloadFiles(files: Type.File[]): Promise<Type.UploadResponse[]> {
    const self = this;

    return new Promise(async (resolve, reject) => {
      const results = [];
      for (const file of files) {
        try {
          const r: Type.UploadResponse = await self.downloadFile(file);
          results.push(r);
        } catch (err) {
          return reject(err);
        }
      }

      return resolve(results);
    });
  }

  public downloadFile(file: Type.File): Promise<Type.UploadResponse> {
    const mtdPath: string = MultiDownloader.MTDPath(file.destination);

    const options = {
      url: file.download,
      path: file.destination
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
    let fileName = file.name;
    if (fileName.length > 50) {
      fileName = `${fileName.substr(0, 47)}...`;
    } else {
      let len = fileName.length;
      while (len < 50) {
        fileName += ' ';
        len += 1;
      }
    }

    const sentValues = [];
    const sentTimestamps = [];
    const bar = new CliProgress.Bar({
      format: `${fileName} [{bar}] {percentage}% | ETA: {eta}s | Speed: {speed}`,
      stopOnComplete: true,
      clearOnComplete: false,
      etaBuffer: 20,
      fps: 5,
      custom: {speed: 'N/A'}
    }, CliProgress.Presets.shades_classic);
    bar.start(1000, 0);

    const downloaded: O = (m: O) => {
      return m.map((meta) => {
        return R.sum(meta.offsets) - R.sum(R.map(R.nth(0), meta.threads)) + R.length(meta.threads) - 1;
      });
    };
    downloaded(meta$).subscribe((d: number) => {
      sentValues.push(d);
      sentTimestamps.push(+ new Date());
    });

    MultiDownloader
      .Completion(meta$)
      .subscribe((i: number) => {
        const p = Math.ceil(i * 1000);
        if (bar.value !== p) {
          bar.update(p, {
            speed: `${this.calculateTransferSpeed(sentValues, sentTimestamps, i === 1 ? null : 10 ).toFixed(1)} MB/s`
          });
        }
      });
    const closeFile = MultiDownloader.FILE.close(fd$).last().toPromise();
    const uploadResponse: Type.UploadResponse = new Type.UploadResponse();

    return uploadResponse.fromPromise(closeFile, file);
  }

  public calculateTransferSpeed(sent: number[], timestamps: number[], buffer: number|null = null) {
    if (sent.length === 0 || timestamps.length === 0) {
      return 0;
    }
    let bytes;
    let ms;
    if (buffer === null) {
      bytes = sent.splice(-1)[0] - sent[0];
      ms = timestamps.splice(-1)[0] - timestamps[0];
    } else {
      bytes = (sent.splice(-1)[0] - sent.splice(-buffer)[0]);
      ms = (timestamps.splice(-1)[0] - timestamps.splice(-buffer)[0]);
    }
    if (ms === 0) {
      return 0;
    }

    return (bytes / 1048576) / (ms / 1000);
  }

  public setupHierarchy(entries: Type.File[], destination: string) {
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

  private location(file: Type.File, destination: string, tree: Map<number, object>) {
    if (!file.parent) {
      return [destination, file.name].join('/');
    }
    const parent = <Type.File>tree.get(+file.parent);
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

}
