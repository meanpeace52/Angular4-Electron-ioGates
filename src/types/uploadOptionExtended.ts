
import {UploadOptions} from "tus-js-client";

export interface UploadOptionsExtended extends UploadOptions {
  metadata: metadata;
  extension: extension;
}

export interface metadata {
  filename: string;
  uuid?: string;
}

export interface extension {
  concatenation: boolean;
}