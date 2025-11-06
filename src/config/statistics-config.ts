import { Config } from './config.interface';

export class StatisticsConfig implements Config {
  public baseUrl: string;
  public endpoint: string;
}
