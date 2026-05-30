import type { ArcaEnvironment, ArcaEnvironmentConfig } from "../environments";
import type { SoapClientFactory, SoapOptions } from "../soap";
import type { WsaaTicketCache } from "./cache";

export type WsaaServiceName = "wsfe" | (string & {});

export type WsaaPemInput = string | Buffer;

export interface WsaaClientOverrides {
  endpoint?: string;
  wsdl?: string;
  soapOptions?: SoapOptions;
}

export interface WsaaAuthProviderOptions {
  certificate: WsaaPemInput;
  privateKey: WsaaPemInput;
  privateKeyPassphrase?: string;
  environment?: ArcaEnvironment | ArcaEnvironmentConfig;
  service?: WsaaServiceName;
  wsaa?: WsaaClientOverrides;
  ticketTimeToLiveMs?: number;
  generationTimeOffsetMs?: number;
  refreshMarginMs?: number;
  cache?: WsaaTicketCache;
  soapClientFactory?: SoapClientFactory;
}

export interface WsaaLoginTicketRequestOptions {
  service: WsaaServiceName;
  now?: Date;
  uniqueId?: number;
  generationTimeOffsetMs?: number;
  ticketTimeToLiveMs?: number;
}

export interface WsaaLoginTicketHeader {
  source?: string;
  destination?: string;
  uniqueId?: string;
  generationTime: Date;
  expirationTime: Date;
}

export interface WsaaLoginTicketResponse {
  header: WsaaLoginTicketHeader;
  token: string;
  sign: string;
  rawXml: string;
}

export interface LoginCmsSoapRequest {
  in0: string;
}

export interface LoginCmsSoapResponseEnvelope {
  loginCmsReturn?: string;
}
