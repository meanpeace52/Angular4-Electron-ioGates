export interface IFile {
  created: Date;
  destination: string;
  download: string;
  downloaded: boolean;
  href: string;
  id: number;
  file_id: number;
  md5: string;
  name: string;
  parent: number|null;
  size: number;
  stream_path: string;
  type: string;
  upload_filename: string;
  uploaded: boolean;
  uuid: string;

  isDirectory(): boolean;
  save();
}
