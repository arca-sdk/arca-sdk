import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ArcaConfigurationError } from "./errors";

export type ArcaEnvironment = "homologacion" | "production";

export interface ArcaServiceEnvironmentConfig {
  endpoint: string;
  wsdl: string;
  remoteWsdl: string;
}

export type ArcaWsfeEnvironmentConfig = ArcaServiceEnvironmentConfig;

export type ArcaWsaaEnvironmentConfig = ArcaServiceEnvironmentConfig;

export interface ArcaEnvironmentConfig {
  name: ArcaEnvironment | string;
  wsaa: ArcaWsaaEnvironmentConfig;
  wsfe: ArcaWsfeEnvironmentConfig;
}

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const localWsaaHomologacionWsdl = resolve(moduleDirectory, "../wsdl/wsaa.homo.wsdl");
const localWsaaProductionWsdl = resolve(moduleDirectory, "../wsdl/wsaa.prod.wsdl");
const localWsfeHomologacionWsdl = resolve(moduleDirectory, "../wsdl/wsfev1.homo.wsdl");
const localWsfeProductionWsdl = resolve(moduleDirectory, "../wsdl/wsfev1.prod.wsdl");

export const ARCA_ENVIRONMENTS = {
  homologacion: {
    name: "homologacion",
    wsaa: {
      endpoint: "https://wsaahomo.afip.gov.ar/ws/services/LoginCms",
      wsdl: localWsaaHomologacionWsdl,
      remoteWsdl: "https://wsaahomo.afip.gov.ar/ws/services/LoginCms?wsdl",
    },
    wsfe: {
      endpoint: "https://wswhomo.afip.gov.ar/wsfev1/service.asmx",
      wsdl: localWsfeHomologacionWsdl,
      remoteWsdl: "https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL",
    },
  },
  production: {
    name: "production",
    wsaa: {
      endpoint: "https://wsaa.afip.gov.ar/ws/services/LoginCms",
      wsdl: localWsaaProductionWsdl,
      remoteWsdl: "https://wsaa.afip.gov.ar/ws/services/LoginCms?wsdl",
    },
    wsfe: {
      endpoint: "https://servicios1.afip.gov.ar/wsfev1/service.asmx",
      wsdl: localWsfeProductionWsdl,
      remoteWsdl: "https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL",
    },
  },
} as const satisfies Record<ArcaEnvironment, ArcaEnvironmentConfig>;

export function resolveArcaEnvironment(environment: ArcaEnvironment | ArcaEnvironmentConfig = "homologacion"): ArcaEnvironmentConfig {
  if (typeof environment !== "string") {
    return environment;
  }

  const config = ARCA_ENVIRONMENTS[environment];

  if (!config) {
    throw new ArcaConfigurationError(`Unsupported ARCA environment: ${environment}`);
  }

  return config;
}
