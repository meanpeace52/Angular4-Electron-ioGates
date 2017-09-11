import * as fs from 'fs';
import * as path from 'path';
import { File} from "../types";
import * as uuid from 'uuid/v1';
import {ReadStream} from "fs";
import * as mime from 'mime-types';

/**
 *  Exports class Directory.
 */
export class Directory {
  public path: string;
  constructor(path: string) {
    this.path = path;
  }

  public create() : Promise<null> {
    return new Promise((resolve: Function, reject: Function) => {
      // console.log('Creating dir: ', this.path);
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

  public read(): Promise<Array<File>> {
    return this.create()
      .then(() => {
        try {
          let promise = [];
          let blobs: File[] = this.walkSync(this.path, []).map((filePath): File => {
            let size = fs.statSync(filePath).size;
            let fileNameSplit = filePath.split('/');
            let file = new File();
            file.name = fileNameSplit[fileNameSplit.length - 1];
            file.type = mime.lookup(file.name) || 'Other';
            file.size = size;
            file.uuid = uuid();
            file.uploaded = false;
            file.stream_path = filePath;
            return file;
          });
          blobs.forEach((file: File) => promise.push(File.createMd5(file)));

          return Promise.all(promise);
        }
        catch (e) {
          return Promise.reject(e);
        }
      })
      .then((file) => Promise.resolve(file));
    // return new Promise((resolve: Function, reject: Function) => {
    //
    // });
  }

  public static getStream(path: string): ReadStream {
    return fs.createReadStream(path);
  }

  public walkSync(dir: string, fileList:Array<string> ): Array<string> {
    let files =  fs.readdirSync(dir);
    if(!Array.isArray(fileList)) {
      fileList = [];
    }

    files.forEach(file => {
      if(fs.statSync(path.join(dir, file)).isDirectory()) {
        fileList = this.walkSync(path.join(dir, file), fileList);
      }
      else {
        fileList.push(path.join(dir, file));
      }
    });

    return fileList;
  }
}
