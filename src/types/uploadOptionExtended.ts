
import {UploadOptions} from "tus-js-client";

export interface UploadOptionsExtended extends UploadOptions {
  metadata: object;
}