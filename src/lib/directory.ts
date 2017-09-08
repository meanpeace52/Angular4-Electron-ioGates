import * as fs from 'fs';
import * as path from 'path';
import * as File from 'vinyl';

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
        // console.log('created dir: ', this.path);

        return resolve(null);
      });
    });
  }

  public read(): Promise<Array<File>> {
    return new Promise((resolve: Function, reject: Function) => {
      try {
        let blobs = this.walkSync(this.path, []).map((filePath): File => {
          let buffer = fs.readFileSync(filePath);
          // let arrayBuffer = Uint8Array.from(buffer).buffer;
          // let fileNameSplit = filePath.split('/');
          // let fileName = fileNameSplit[fileNameSplit.length - 1];
          let file = new File();
          file.contents = buffer;
          return file;
        });
        return resolve(blobs);
      }
      catch (e) {
        return reject(e);
      }
    });
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
