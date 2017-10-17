import { Readable, Transform } from 'stream';
import * as fs from 'fs';

export class BufferSource {
  private size: number;
  private _buffer: Buffer;

  constructor(buffer: Buffer) {
    this._buffer = buffer;
    this.size = buffer.length;
  }

  public slice(start: number, end: number): Buffer {
    const buf = this._buffer.slice(start, end);
    this.size = buf.length;

    return buf;
  }

  public close() {}
}

export class FileSource {
  private _stream: any;
  private _path: string;

  constructor(stream: any) {
    this._stream = stream;
    this._path = stream.path.toString();
  }

  public slice(start: number, end: number) {
    let stream = (<any> fs.createReadStream(this._path, {
      start: start,
      end: end,
      autoClose: true
    }));
    stream.size = end - start;

    return stream;
  }

  public close() {
    this._stream.destroy();
  }
}

export class StreamSource {

  private size: number;
  private _stream: any;
  private _buf: Buffer;
  private _bufPos: number;
  private _bufLen: number;
  private chunkSize: number;

  constructor(stream: any, chunkSize: number) {
    this._stream = stream;
    // Ensure that chunkSize is an integer and not something else or Infinity.
    this.chunkSize = +chunkSize;
    if (!isFinite(this.chunkSize)) {
      throw new Error("cannot create source for stream without a finite value for the `chunkSize` option");
    }

    // for how much data this stream will emit requiring the user to specify
    // it manually (see the `uploadSize` option).
    this.size = null;

    stream.pause();

    this._buf = new Buffer(this.chunkSize);
    this._bufPos = null;
    this._bufLen = 0;
  }

  public slice(start: number, end: number) {
    // Always attempt to drain the buffer first, even if this means that we
    // return less data, then the caller requested.
    if (start >= this._bufPos && start < (this._bufPos + this._bufLen)) {
      const bufStart = start - this._bufPos;
      const bufEnd = Math.min(this._bufLen, end - this._bufPos);
      const buf = (<any> this._buf.slice(bufStart, bufEnd));
      buf.size = buf.length;

      return buf;
    }

    // Fail fast if the caller requests a proportion of the data which is not
    // available any more.
    if (start < this._bufPos) {
      throw new Error("cannot slice from position which we already seeked away");
    }

    this._bufPos = start;
    this._bufLen = 0;

    const bytesToSkip = start - this._bufPos;
    const bytesToRead = end - start;
    const slicingStream = (<any> new SlicingStream(bytesToSkip, bytesToRead, this));
    this._stream.pipe(slicingStream);
    slicingStream.size = bytesToRead;

    return slicingStream;
  }

  public close() {
    //this._stream.
  }
}

export class SlicingStream extends Transform {
  private _bytesToSkip: number;
  private _bytesToRead: number;
  private _source: any;

  constructor(bytesToSkip, bytesToRead, source) {
    super();

    // The number of bytes we have to discard before we start emitting data.
    this._bytesToSkip = bytesToSkip;
    // The number of bytes we will emit in the data events before ending this stream.
    this._bytesToRead = bytesToRead;
    // Points to the StreamSource object which created this SlicingStream.
    // This reference is used for manipulating the _bufLen and _buf properties
    // directly.
    this._source = source;
  }

  _transform(chunk, encoding, callback) {
    // Calculate the number of bytes we still have to skip before we can emit data.
    let bytesSkipped = Math.min(this._bytesToSkip, chunk.length);
    this._bytesToSkip -= bytesSkipped;

    // Calculate the number of bytes we can emit after we skipped enough data.
    let bytesAvailable = chunk.length - bytesSkipped;

    // If no bytes are available, because the entire chunk was skipped, we can
    // return earily.
    if (bytesAvailable === 0) {
      callback(null);
      return;
    }

    let bytesToRead = Math.min(this._bytesToRead, bytesAvailable);
    this._bytesToRead -= bytesToRead;

    if (bytesToRead !== 0) {
      let data = chunk.slice(bytesSkipped, bytesSkipped + bytesToRead);
      this._source._bufLen += data.copy(this._source._buf, this._source._bufLen);
      this.push(data);
    }

    // If we do not have to read any more bytes for this transform stream, we
    // end it and also unpipe our source, to avoid calls to _transform in the
    // future
    if (this._bytesToRead === 0) {
      this._source._stream.unpipe(this);
      this.end();
    }

    // If we did not use all the available data, we return it to the source
    // so the next SlicingStream can handle it.
    if (bytesToRead !== bytesAvailable) {
      let unusedChunk = chunk.slice(bytesSkipped + bytesToRead);
      this._source._stream.unshift(unusedChunk);
    }

    callback(null);
  }
}

export function getSource(input: any, chunkSize: number) {
  if (Buffer.isBuffer(input)) {
    return new BufferSource(input);
  }

  if (input instanceof fs.createReadStream && input.path != null) {
    return new FileSource(input);
  }

  if (input instanceof Readable) {
    return new StreamSource(input, chunkSize);
  }

  throw new Error("source object may only be an instance of Buffer or Readable in this environment");
}
