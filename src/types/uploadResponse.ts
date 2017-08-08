import { File } from './models/file';
/**
 * Exports UploadResponse class
 */
export class UploadResponse {
  public dest: string;
  public file: File;
  public success: boolean;
  public timeTaken: number;

  public fromPromise(promise: Promise<undefined>, file: File, dest: string) : Promise<UploadResponse> {
    return promise
      .then(() => {
        this.dest = dest;
        this.file = file;
        this.success = true;

        return this;
      });
  }
}
