/**
 * Exports Input format for Download command
 */
export class CommandDownloadInput {
  public options: object;
  public dir: string;
  public url: string;
}

export class CommandUploadOptions {
  public delete: boolean;
  public verbose: boolean;
  public watch: boolean;
  public delay: boolean | number;
  public chunksize: false | number;
  public thread: number;
}

export class CommandUploadInput {
  public options: CommandUploadOptions;
  public dir: string;
  public url: string;
}

export interface CommandListInput {
  entity: string;
  options?: {
    entity: string
  };
}

export interface CommandRemoveInput {
    options: {
        dir: string;
        url: string;
        id: number;
        remove: boolean;
    };
}
export interface CommandAddInput {
  direction: string;
  dir: string;
  url: string;
  options: object;
}

export interface TusProgressEvent {
  bytesUploaded: number;
  bytesTotal: number;
}
