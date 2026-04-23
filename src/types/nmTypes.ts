export interface NMTitle {
  type: { value: string };
  value: string;
}

export interface NMMultimedia {
  usage?: { value: string } | string;
  imageUrl?: string;
  iiifUrl?: string;
  type?: string;
  photoCredit?: string;
  creditLine?: string;
  publishable?: boolean;
  thumbnail?: boolean;
}

export interface NMPersonRefMetaData {
  FullName: string;
}

export interface NMProduction {
  PersonRefMetaData?: NMPersonRefMetaData;
}

export interface NMOnlineCollection {
  Production?: NMProduction[];
}

export interface NMObject {
  id: string;
  titles: NMTitle[];
  publishableDimensions?: string;
  materialTechniqueDescription?: string;
  techniques?: { value: string; authority?: string }[];
  materials?: { value: string; authority?: string }[];
  online_collection?: NMOnlineCollection;
  multimedia?: NMMultimedia[];
  ObjectName?: string[];
  MaterialTechnique?: string[];
  production?: any[];
  productions?: any[];
  production_events?: any[];
}
