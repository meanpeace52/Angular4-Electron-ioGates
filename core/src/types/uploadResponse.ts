/**
 * Exports UploadResponse class
 */

import {IFile} from '../lib/ifile';

export class UploadResponse {
  public dest: string;
  public file: IFile;
  public success: boolean;
  public timeTaken: number;

  public fromPromise(promise: Promise<undefined>, file: IFile) : Promise<UploadResponse> {
    return promise
      .then(() => {
        this.dest = file.destination;
        this.file = file;
        this.success = true;

        return this;
      });
  }
}
