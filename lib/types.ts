export type Tier = 'lead' | 'runnerUp' | 'mid' | 'brief';
export type HostType = 'Webring' | 'Fan Archive' | 'Hobby Club' | 'Personal Homepage';

export interface ThumbnailInfo {
  imageUrl: string | null;
  color: string;
}

export interface CdxRecord {
  urlkey: string;
  timestamp: string;
  original: string;
  mimetype: string;
  statuscode: string;
  digest: string;
  length: string;
}

export interface WaybackItem {
  url: string;
  captureUrl: string;
  domain: string;
  year: number;
  title: string;
  description: string;
  hostType: HostType;
  tier: Tier;
  thumbnail: ThumbnailInfo;
}
