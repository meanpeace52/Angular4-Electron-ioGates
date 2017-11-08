import { File } from './';
export class Share {

  public static DIRECTION_UPLOAD: string = 'UPLOAD';
  public static DIRECT_DOWNLOAD: string = 'DOWNLOAD';
  public static DIRECT_BI: string = 'BI';

  id: number;
  url: string;
  token: string;
  direction: string;
  dir: string;
  complete?: boolean;

  public files?: File[] = [];

}