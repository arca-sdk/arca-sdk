import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ArcaConfigurationError } from "./errors";

export type ArcaEnvironment = "homologacion" | "production";

export interface ArcaWsfeEnvironmentConfig {
  endpoint: string;
  wsdl: string;
  remoteWsdl: string;
}

export interface ArcaEnvironmentConfig {
  name: ArcaEnvironment | string;
  wsfe: ArcaWsfeEnvironmentConfig;
}

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const localHomologacionWsdl = resolve(moduleDirectory, "../wsdl/wsfev1.homo.wsdl");
const localProductionWsdl = resolve(moduleDirectory, "../wsdl/wsfev1.prod.wsdl");

export const ARCA_ENVIRONMENTS = {
  homologacion: {
    name: "homologacion",
    wsfe: {
      endpoint: "https://wswhomo.afip.gov.ar/wsfev1/service.asmx",
      wsdl: localHomologacionWsdl,
      remoteWsdl: "https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL",
    },
  },
  production: {
    name: "production",
    wsfe: {
      endpoint: "https://servicios1.afip.gov.ar/wsfev1/service.asmx",
      wsdl: localProductionWsdl,
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
