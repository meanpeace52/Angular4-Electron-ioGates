import { File } from './models/file';

/**
 * Exports UploadResponse class
 */
export class UploadResponse {
  public dest: string;
  public file: File;
  public success: boolean;
  public timeTaken: number;

  public fromPromise(promise: Promise<undefined>, file: File) : Promise<UploadResponse> {
    return promise
      .then(() => {
        this.dest = file.destination;
        this.file = file;
        this.success = true;
        global['logger'].info('completed %s', file.destination);

        return this;
      });
  }
}
