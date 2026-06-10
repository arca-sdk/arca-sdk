import { resolveArcaEnvironment, type ArcaEnvironment, type ArcaEnvironmentConfig } from "./environments";
import { WsfeClient, type WsfeClientOptions } from "./wsfe/client";
import type { ArcaAuthInput } from "./auth";
import type { ArcaCuit } from "./cuit";
import type { SoapOptions } from "./soap";

export interface ArcaWsfeClientOverrides {
  endpoint?: string;
  wsdl?: string;
  soapOptions?: SoapOptions;
}

export interface CreateArcaClientOptions {
  cuit: ArcaCuit;
  auth: ArcaAuthInput;
  environment?: ArcaEnvironment | ArcaEnvironmentConfig;
  wsfe?: ArcaWsfeClientOverrides;
}

export interface ArcaClient {
  readonly wsfe: WsfeClient;
}

export function createArcaClient(options: CreateArcaClientOptions): ArcaClient {
  const environment = resolveArcaEnvironment(options.environment);

  const wsfeOptions: WsfeClientOptions = {
    auth: options.auth,
    cuit: options.cuit,
    endpoint: options.wsfe?.endpoint ?? environment.wsfe.endpoint,
    wsdl: options.wsfe?.wsdl ?? environment.wsfe.wsdl,
  };

  if (options.wsfe?.soapOptions !== undefined) {
    wsfeOptions.soapOptions = options.wsfe.soapOptions;
  }

  return {
    wsfe: new WsfeClient(wsfeOptions),
  };
}
