import {IFiles} from '../lib/ifiles';
import { File } from './models/file';

/**
 * Exports Files class.
 */
export class Files implements IFiles {
  public map: Map<string, string>;
  public files: File[];
}

export class ReadableStreamFile {
  constructor(
    public path: string,
    public fileName: string,
    public size: number,
    public uuid: string
  ) {}
}
