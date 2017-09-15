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
  public delay: boolean|number;
}

export class CommandUploadInput {
  public options: CommandUploadOptions;
  public dir: string;
  public url: string;
}

export interface CommandListInput {
  entity:string;
  options?: {
    entity: string
  };
}

export interface CommandAddInput {
  direction: string;
  dir: string;
  url: string;
  options: object;
}