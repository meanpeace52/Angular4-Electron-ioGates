
import {UploadOptions} from 'tus-js-client';

export interface IUploadOptionsExtended extends UploadOptions {
  metadata: IMetadata;
  fileOffset: number;
  extensions: IExtension;
}

export interface IMetadata {
  filename: string;
  uuid?: string;
}

export interface IExtension {
  concatenation: boolean;
  checksum: boolean;
}
