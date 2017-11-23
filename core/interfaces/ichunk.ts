import {IFile} from './ifile';

export interface IChunk {
  uploaded: boolean;
  offset: number;
  resume_url: string;
  uuid: string;
  file_id: number;
  file: IFile;
  starting_point: number;
  ending_point: number;
  size: number;
  uploaded_started: boolean;
}
