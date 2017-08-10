import fs from 'fs';

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
      fs.mkdir(this.path, (err: Object) => {
        if (err instanceof Error) {
          return reject(err);
        }

        return resolve(null);
      });
    });
  }
}
