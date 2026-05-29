import soap from "soap";
import { ArcaSoapMethodNotFoundError, ArcaUnexpectedResponseError } from "../errors";
import type { WsfeOperationName } from "../wsfe/types.generated";
import type { Client, IOptions } from "soap";

export type SoapOptions = IOptions;

export interface SoapClientLike {
  setEndpoint?: (endpoint: string) => void;
  [methodName: string]: unknown;
}

export interface SoapClientFactoryInput {
  wsdl: string;
  endpoint: string;
  options?: SoapOptions;
}

export type SoapClientFactory = (input: SoapClientFactoryInput) => Promise<SoapClientLike>;

export async function createNodeSoapClient(input: SoapClientFactoryInput): Promise<SoapClientLike> {
  const client = (await soap.createClientAsync(input.wsdl, input.options ?? {})) as Client & SoapClientLike;
  client.setEndpoint?.(input.endpoint);
  return client;
}

export type SoapAsyncMethod = (request: unknown) => Promise<unknown>;

export function getSoapAsyncMethod(client: SoapClientLike, operation: WsfeOperationName): SoapAsyncMethod {
  const methodName = `${operation}Async`;
  const method = client[methodName];

  if (typeof method !== "function") {
    throw new ArcaSoapMethodNotFoundError(`SOAP method ${methodName} was not found in the WSFE client.`, {
      operation,
    });
  }

  return method.bind(client) as SoapAsyncMethod;
}

export function unwrapSoapAsyncResult<TEnvelope>(result: unknown): TEnvelope {
  if (Array.isArray(result)) {
    return result[0] as TEnvelope;
  }

  return result as TEnvelope;
}

export function unwrapSoapEnvelopeResult<TEnvelope extends object, TResult>(
  envelope: TEnvelope,
  resultKey: keyof TEnvelope & string,
  operation: WsfeOperationName,
): TResult {
  const result = (envelope as Record<string, unknown>)[resultKey];

  if (result === null || result === undefined) {
    throw new ArcaUnexpectedResponseError(`SOAP operation ${operation} did not return ${resultKey}.`, {
      operation,
    });
  }

  return result as TResult;
}
