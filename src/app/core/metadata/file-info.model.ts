import { autoserialize, autoserializeAs } from 'cerialize';

export class FileInfo {
  @autoserialize name: string;
  @autoserialize content: any;
  @autoserialize size: string;
  @autoserialize isDirectory: boolean;
  @autoserializeAs('sub') sub: { [key: string]: FileInfo };
}
