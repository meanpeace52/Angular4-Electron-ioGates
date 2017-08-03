/**
 * Exports Auth class.
 */
export class Auth {
  public token: string;
}

/**
 * Exports File class.
 */
export class File {
  public id: number;
  public name: string;
  public type: string;
  public parent: number;
  public href: string;
  public download: string;
  public md5: string;
}

/**
 * Exports Files class.
 */
export class Files {
  public map: Map<string, string>;
  public files: File[];
}
