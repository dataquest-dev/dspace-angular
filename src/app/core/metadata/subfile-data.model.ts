/**
 * Represents the raw data structure returned from the API for sub-files
 * within zip archives or directories
 */
export interface SubFileResponse {
  // The hashtable structure returned from the API
  [key: string]: {
    name?: string;
    content?: any;
    size?: string;
    isDirectory?: boolean;
  };
}
