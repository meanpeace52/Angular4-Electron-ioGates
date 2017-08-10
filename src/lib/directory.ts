import * as fs from 'fs';

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
      console.log('Creating dir: ', this.path);
      fs.mkdir(this.path, (err: Object) => {
        if (err instanceof Error) {
          return reject(err);
        }
        console.log('created dir: ', this.path);

        return resolve(null);
      });
    });
  }
}
