import {
  File
} from '../lib/types';
import * as CliProgress from 'cli-progress';

export const makeFileName = (file: File) => {
  let fileName = file.name;
  if (fileName.length > 50) {
    fileName = `${fileName.substr(0, 47)}...`;
  } else {
    let len = fileName.length;
    while (len < 50) {
      fileName += ' ';
      len += 1;
    }
  }

  return fileName;
};

export const setupProgressBar = (file: File) => {
  return new CliProgress.Bar({
    format: `${makeFileName(file)} [{bar}] {percentage}% | ETA: {eta}s | Speed: {speed}`,
    stopOnComplete: true,
    clearOnComplete: false,
    etaBuffer: 20,
    fps: 5,
    payload: {speed: 'N/A'}
  }, CliProgress.Presets.shades_classic);
};
