import { EventEmitter } from '@angular/core';

/**
 * File entity class object.
 * @author Hamza Waqas hamzahwaqas@gmail.com
 */
export class File {
  id: string;
  name: string;
  type: string;
  parent: number;
  created: Date;
  href: string;
  download: string;
  md5: string;
  destination: string;
  // uploadStatus: object;
  // downloadStatus: object;

  /**
   * Retrieves the file from IOGate's Server.
   * @param {string} id The unique ID of the file 
   * @returns {File} File object prepared by data from server.
   */
  public static GetById(id: string) {
  }

  public static FromArray(arr: Array<object>) {
    let files = [];
    arr.forEach(record => {
      files.push(<File> record);
    });
    return files;
  }

  /**
   * Tells if it's a directory object.
   * @function isDirectory
   * @return {boolean} True if it's a directory.
   * @example 
   * // returns boolean
   * file.isDirectory();
   */
  public isDirectory() {
    return this.type === 'dir';
  }

  /**
   * Store file back to server.
   */
  public save() {
  }

  /**
   * Deletes the file from IOGates. If argument is provided as true,
   * file will be deleted from local dir too.
   * @param {boolean} fromLocal If the file should be deleted from disk too.
   */
  public delete(fromLocal: boolean = false) {

  }

  /**
   * Download the file from remote server to disk.
   */
  public downloadFile() {

  }

  /**
   * Upload file to remote server of IOGates.
   */
  public uploadFile() {

  }
}
