import * as Bluebird from 'bluebird';
import * as fs from 'fs';
import { ReadStream } from 'fs';
import * as mime from 'mime-types';
import * as path from 'path';
import * as uuid from 'uuid/v1';
import {File as IOFile} from '../types/file';

/**
 *  Exports class Directory.
 */
export class Directory {
  public path: string;
  constructor(dirPath: string) {
    this.path = dirPath;
  }

  public static GET_STREAM(dirPath: string): ReadStream {
    return fs.createReadStream(dirPath);
  }

  public static DELETE(dir: string) {
    return new Promise((resolve: Function, reject: Function) => {
      fs.rmdir(dir, (err: any) => {
        if (err instanceof Error) {
          if (/ENOENT/ig.test(err.message)) {
            return resolve();
          }

          return reject(err);
        }

        return resolve();
      });
    });
  }

  public create(): Bluebird<null> {
    return new Bluebird((resolve: Function, reject: Function) => {
      //global['logger'].info('creating dir %s', this.path);
      fs.mkdir(this.path, (err: Object) => {
        if (err instanceof Error) {
          if (/EEXIST/ig.test(err.message)) {

            return resolve(null);
          }

          return reject(err);
        }

        return resolve(null);
      });
    });
  }

  public read(): Bluebird<IOFile[]> {
    return this.create()
      .then(() => {
        try {
          const promise = [];
          const blobs: IOFile[] = this.walkSync(this.path, []).map((filePath: string): IOFile => {
            const size = fs.statSync(filePath).size;
            const file = new IOFile();
            file.name = path.basename(filePath);
            file.type = mime.lookup(file.name) || 'Other';
            file.size = size;
            file.uuid = uuid();
            file.uploaded = false;
            file.stream_path = filePath;

            return file;
          });
          blobs.forEach((file: IOFile) => promise.push(IOFile.CREATE_MD5(file)));

          return Bluebird.all(promise);
        } catch (e) {
          return Bluebird.reject(e);
        }
      })
      .then((files: IOFile[]) => Promise.resolve(files));
  }

  public walkSync(dir: string, fileList: string[]): string[] {
    const files = fs.readdirSync(dir);
    if (!Array.isArray(fileList)) {
      fileList = [];
    }

    files.forEach((file: string) => {
      if (fs.statSync(path.join(dir, file)).isDirectory()) {
        fileList = this.walkSync(path.join(dir, file), fileList);
      } else if (file.substr(0, 1) !== '.') {
        fileList.push(path.join(dir, file));
      }
    });

    return fileList;
  }
}
