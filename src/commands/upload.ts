import {
  CommandDownloadInput,
  Files,
  UploadResponse,
  Share,
  File
} from '../lib/types';
import { IOGates } from '../lib/iogates';
import { Downloader } from '../lib/downloader';
import { Directory } from '../lib/directory';
import * as winston from 'winston';

export function uploadCommand(args: CommandDownloadInput, done: Function) {
  const destination = args.dir;
  const shareUrl = args.url;
  const ioGate: IOGates = new IOGates();
  const directory: Directory = new Directory(destination);
  let log = function (...p) { };
  if (args.options['verbose']) {
    log = winston.info;
  }

  log('executing download');

  directory
    .read()
    .then()

}