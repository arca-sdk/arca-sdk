export { createArcaClient } from "./client";
export type { ArcaClient, ArcaWsfeClientOverrides, CreateArcaClientOptions } from "./client";

export { createStaticAuthProvider, isArcaAuthProvider, resolveAuthTicket } from "./auth";
export type { ArcaAuthInput, ArcaAuthProvider, ArcaAuthTicket, ArcaResolvedAuthTicket } from "./auth";

export { normalizeCuit } from "./cuit";
export type { ArcaCuit } from "./cuit";

export { ARCA_ENVIRONMENTS, resolveArcaEnvironment } from "./environments";
export type {
  ArcaEnvironment,
  ArcaEnvironmentConfig,
  ArcaServiceEnvironmentConfig,
  ArcaWsaaEnvironmentConfig,
  ArcaWsfeEnvironmentConfig,
} from "./environments";

export {
  ArcaAuthError,
  ArcaConfigurationError,
  ArcaSdkError,
  ArcaSoapError,
  ArcaSoapMethodNotFoundError,
  ArcaUnexpectedResponseError,
} from "./errors";
export type { ArcaErrorOptions } from "./errors";

export {
  WsaaClient,
  createFileWsaaTicketCache,
  createWsaaAuthProvider,
  createWsaaLoginTicketRequestXml,
  createWsaaTicketCacheKey,
  parseWsaaLoginTicketResponse,
  signCms,
} from "./wsaa";
export type {
  LoginCmsSoapRequest,
  LoginCmsSoapResponseEnvelope,
  SignCmsOptions,
  WsaaAuthProviderOptions,
  WsaaClientOptions,
  WsaaClientOverrides,
  WsaaFileTicketCacheOptions,
  WsaaLoginTicketHeader,
  WsaaLoginTicketRequestOptions,
  WsaaLoginTicketResponse,
  WsaaPemInput,
  WsaaServiceName,
  WsaaTicketCache,
  WsaaTicketCacheKey,
} from "./wsaa";

export { WsfeClient } from "./wsfe";
export type { WsfeClientOptions } from "./wsfe";
export type * from "./wsfe/types.generated";
