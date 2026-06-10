import {
  decodeXmlEntities,
  escapeXml,
  findDirectChild,
  firstElement,
  isXmlNamespaceAttribute,
  parseXml,
  type XmlNode,
} from "./xml";
import {
  findGlobalElement,
  getComplexTypeChildren,
  isArrayElement,
  loadWsdlModel,
  parsePrimitiveValue,
  resolveElementComplexType,
  type SchemaComplexType,
  type SchemaElement,
  type SoapOperation,
  type WsdlModel,
} from "./wsdl";

type FetchImplementation = typeof globalThis.fetch;
type FetchInit = NonNullable<Parameters<FetchImplementation>[1]>;

export interface SoapOptions {
  attributesKey?: string;
  disableCache?: boolean;
  endpoint?: string;
  envelopeKey?: string;
  envelopeSoapUrl?: string;
  escapeXML?: boolean;
  fetch?: FetchImplementation;
  forceSoap12Headers?: boolean;
  handleNilAsNull?: boolean;
  headers?: Record<string, string>;
  overridePromiseSuffix?: string;
  valueKey?: string;
  wsdl_headers?: Record<string, string>;
  wsdlHeaders?: Record<string, string>;
  xmlKey?: string;
  [key: string]: unknown;
}

export interface SoapClient {
  lastEndpoint?: string;
  lastElapsedTime?: number;
  lastRequest?: string;
  lastRequestHeaders?: Record<string, string>;
  lastResponse?: string;
  lastResponseHeaders?: Record<string, string>;
  setEndpoint: (endpoint: string) => void;
  [methodName: string]: unknown;
}

export type SoapCallback = (
  error: unknown,
  result?: unknown,
  rawResponse?: string,
  soapHeader?: unknown,
  rawRequest?: string,
) => void;

export type SoapAsyncTuple = [
  result: unknown,
  rawResponse: string,
  soapHeader: unknown,
  rawRequest: string,
  mtomAttachments?: unknown,
];

interface SoapInvocationOptions {
  fetch?: FetchImplementation;
  headers?: Record<string, string>;
  signal?: FetchInit["signal"];
}

const DEFAULT_ATTRIBUTES_KEY = "attributes";
const DEFAULT_ENVELOPE_KEY = "soap";
const DEFAULT_ENVELOPE_SOAP_URL = "http://schemas.xmlsoap.org/soap/envelope/";
const DEFAULT_VALUE_KEY = "$value";
const DEFAULT_XML_KEY = "$xml";
const SOAP12_ENVELOPE_URL = "http://www.w3.org/2003/05/soap-envelope";

export async function createClientAsync(wsdlLocation: string, options: SoapOptions = {}, endpoint?: string): Promise<SoapClient> {
  const wsdl = await loadWsdlModel(wsdlLocation, options);
  return new FetchSoapClient(wsdl, endpoint ?? options.endpoint ?? wsdl.endpoint, options);
}

class FetchSoapClient implements SoapClient {
  [methodName: string]: unknown;

  lastEndpoint?: string;
  lastElapsedTime?: number;
  lastRequest?: string;
  lastRequestHeaders?: Record<string, string>;
  lastResponse?: string;
  lastResponseHeaders?: Record<string, string>;

  private endpoint: string;
  private readonly attributesKey: string;
  private readonly envelopeKey: string;
  private readonly envelopeSoapUrl: string;
  private readonly escapeXML: boolean;
  private readonly fetchImpl: FetchImplementation;
  private readonly valueKey: string;
  private readonly xmlKey: string;

  constructor(
    private readonly wsdl: WsdlModel,
    endpoint: string | undefined,
    private readonly options: SoapOptions,
  ) {
    if (!endpoint) {
      throw new Error("SOAP endpoint was not provided and could not be read from the WSDL.");
    }

    const fetchImpl = options.fetch ?? globalThis.fetch;

    if (typeof fetchImpl !== "function") {
      throw new Error("A fetch implementation is required to create a SOAP client.");
    }

    this.endpoint = endpoint;
    this.attributesKey = options.attributesKey ?? DEFAULT_ATTRIBUTES_KEY;
    this.envelopeKey = options.envelopeKey ?? DEFAULT_ENVELOPE_KEY;
    this.envelopeSoapUrl = options.forceSoap12Headers === true ? SOAP12_ENVELOPE_URL : options.envelopeSoapUrl ?? DEFAULT_ENVELOPE_SOAP_URL;
    this.escapeXML = options.escapeXML !== false;
    this.fetchImpl = fetchImpl;
    this.valueKey = options.valueKey ?? DEFAULT_VALUE_KEY;
    this.xmlKey = options.xmlKey ?? DEFAULT_XML_KEY;

    this.initializeOperations();
  }

  setEndpoint(endpoint: string): void {
    this.endpoint = endpoint;
  }

  private initializeOperations(): void {
    const promiseSuffix = this.options.overridePromiseSuffix ?? "Async";

    for (const operation of this.wsdl.operations.values()) {
      this[operation.name] = (args: unknown, callback?: SoapCallback, requestOptions?: SoapInvocationOptions, extraHeaders?: Record<string, string>) => {
        if (typeof callback !== "function") {
          throw new TypeError(`SOAP method ${operation.name} requires a callback. Use ${operation.name}${promiseSuffix} for promises.`);
        }

        this.invoke(operation, args, requestOptions, extraHeaders).then(
          ([result, rawResponse, soapHeader, rawRequest]) => callback(null, result, rawResponse, soapHeader, rawRequest),
          (error: unknown) => callback(error),
        );
      };
      this[`${operation.name}${promiseSuffix}`] = (args: unknown, requestOptions?: SoapInvocationOptions, extraHeaders?: Record<string, string>) =>
        this.invoke(operation, args, requestOptions, extraHeaders);
    }
  }

  private async invoke(
    operation: SoapOperation,
    args: unknown,
    requestOptions: SoapInvocationOptions = {},
    extraHeaders: Record<string, string> = {},
  ): Promise<SoapAsyncTuple> {
    const endpoint = this.endpoint;
    const soapAction = operation.soapAction;
    const xml = this.createEnvelope(operation, args ?? {});
    const headers = this.createHeaders(soapAction, requestOptions.headers, extraHeaders);
    const fetchImpl = requestOptions.fetch ?? this.fetchImpl;
    const requestInit: FetchInit = {
      body: xml,
      headers,
      method: "POST",
    };

    if (requestOptions.signal !== undefined) {
      requestInit.signal = requestOptions.signal;
    }

    const startedAt = Date.now();
    this.lastEndpoint = endpoint;
    this.lastRequest = xml;
    this.lastRequestHeaders = headers;

    const response = await fetchImpl(endpoint, requestInit);
    const rawResponse = await response.text();
    this.lastElapsedTime = Date.now() - startedAt;
    this.lastResponse = rawResponse;
    this.lastResponseHeaders = responseHeadersToObject(response.headers);

    const parsed = this.parseSoapResponse(operation, rawResponse);

    if (!response.ok && parsed.fault === undefined) {
      throw createHttpError(response.status, response.statusText, rawResponse);
    }

    if (parsed.fault !== undefined) {
      throw parsed.fault;
    }

    return [parsed.result, rawResponse, parsed.header, xml, undefined];
  }

  private createEnvelope(operation: SoapOperation, args: unknown): string {
    const message = this.createMessage(operation, args);
    return `<?xml version="1.0" encoding="utf-8"?>` +
      `<${this.envelopeKey}:Envelope xmlns:${this.envelopeKey}="${this.envelopeSoapUrl}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">` +
      `<${this.envelopeKey}:Body>` +
      message +
      `</${this.envelopeKey}:Body>` +
      `</${this.envelopeKey}:Envelope>`;
  }

  private createMessage(operation: SoapOperation, args: unknown): string {
    if (isRecord(args) && typeof args._xml === "string") {
      return args._xml;
    }

    const namespace = operation.requestNamespaceURI;
    const rootName = `tns:${operation.name}`;
    const namespaceAttributes = ` xmlns:tns="${escapeXml(namespace)}" xmlns="${escapeXml(namespace)}"`;

    return this.serializeElement(rootName, args, namespaceAttributes);
  }

  private serializeElement(name: string, value: unknown, extraAttributes = ""): string {
    if (Array.isArray(value)) {
      return value.map((item) => this.serializeElement(name, item, extraAttributes)).join("");
    }

    if (value === null) {
      return `<${name}${extraAttributes} xsi:nil="true"></${name}>`;
    }

    if (isRecord(value)) {
      const rawXml = value[this.xmlKey];

      if (typeof rawXml === "string") {
        return `<${name}${extraAttributes}>${rawXml}</${name}>`;
      }

      const attributes = this.serializeAttributes(value[this.attributesKey]);
      const valueContent = value[this.valueKey];
      let body = "";

      if (valueContent !== undefined) {
        body += this.serializeText(valueContent);
      }

      for (const [childName, childValue] of Object.entries(value)) {
        if (childName === this.attributesKey || childName === this.valueKey || childName === this.xmlKey) {
          continue;
        }

        if (childValue === undefined) {
          continue;
        }

        body += this.serializeElement(childName, childValue);
      }

      return `<${name}${attributes}${extraAttributes}>${body}</${name}>`;
    }

    if (value === undefined) {
      return "";
    }

    return `<${name}${extraAttributes}>${this.serializeText(value)}</${name}>`;
  }

  private serializeAttributes(value: unknown): string {
    if (!isRecord(value)) {
      return "";
    }

    return Object.entries(value)
      .filter(([, attributeValue]) => attributeValue !== undefined)
      .map(([attributeName, attributeValue]) => ` ${attributeName}="${escapeXml(attributeValue)}"`)
      .join("");
  }

  private serializeText(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }

    return this.escapeXML ? escapeXml(value) : String(value);
  }

  private createHeaders(
    soapAction: string,
    requestHeaders: Record<string, string> | undefined,
    extraHeaders: Record<string, string>,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "text/xml,application/xml,*/*",
    };

    if (this.options.forceSoap12Headers === true) {
      headers["Content-Type"] = `application/soap+xml; charset=utf-8; action="${soapAction}"`;
    } else {
      headers["Content-Type"] = "text/xml; charset=utf-8";
      headers.SOAPAction = `"${soapAction}"`;
    }

    return {
      ...headers,
      ...this.options.headers,
      ...requestHeaders,
      ...extraHeaders,
    };
  }

  private parseSoapResponse(operation: SoapOperation, rawResponse: string): { fault?: Error; header: unknown; result: unknown } {
    const envelopeXml = extractSoapEnvelope(rawResponse);
    const document = parseXml(envelopeXml);
    const envelope = firstElement(document);

    if (!envelope) {
      throw new Error("SOAP response did not contain an envelope.");
    }

    const headerNode = findDirectChild(envelope, "Header");
    const bodyNode = findDirectChild(envelope, "Body");

    if (!bodyNode) {
      throw new Error("SOAP response did not contain a Body element.");
    }

    const faultNode = findDirectChild(bodyNode, "Fault");
    const header = headerNode ? this.nodeToValue(headerNode) : undefined;

    if (faultNode) {
      return {
        fault: createSoapFaultError(this.nodeToValue(faultNode)),
        header,
        result: undefined,
      };
    }

    const responseNode = bodyNode.children.find((child) => child.localName !== "Fault");

    if (!responseNode) {
      return {
        header,
        result: {},
      };
    }

    const responseElement =
      findGlobalElement(this.wsdl, responseNode.localName) ?? findGlobalElement(this.wsdl, operation.responseElementName);

    return {
      header,
      result: this.nodeToValue(responseNode, responseElement),
    };
  }

  private nodeToValue(node: XmlNode, element?: SchemaElement): unknown {
    if (isNilNode(node)) {
      return this.options.handleNilAsNull === true ? null : undefined;
    }

    const complexType = resolveElementComplexType(this.wsdl, element);

    if (node.children.length === 0) {
      const text = decodeXmlEntities(node.text.trim());

      if (text.length === 0) {
        return element?.type?.localName === "string" ? "" : null;
      }

      return parsePrimitiveValue(text, element?.type);
    }

    return this.nodeChildrenToObject(node, complexType);
  }

  private nodeChildrenToObject(node: XmlNode, complexType: SchemaComplexType | undefined): Record<string, unknown> {
    const object: Record<string, unknown> = {};
    const childDefinitions = getComplexTypeChildren(this.wsdl, complexType);
    const attributes = nonNamespaceAttributes(node);

    if (Object.keys(attributes).length > 0) {
      object[this.attributesKey] = attributes;
    }

    for (const child of node.children) {
      const childDefinition = childDefinitions.find((definition) => definition.name === child.localName);
      const value = this.nodeToValue(child, childDefinition);

      if (value === undefined) {
        continue;
      }

      if (isArrayElement(childDefinition)) {
        const current = object[child.localName];

        if (Array.isArray(current)) {
          current.push(value);
        } else {
          object[child.localName] = [value];
        }

        continue;
      }

      if (Object.hasOwn(object, child.localName)) {
        const current = object[child.localName];
        object[child.localName] = Array.isArray(current) ? [...current, value] : [current, value];
      } else {
        object[child.localName] = value;
      }
    }

    return object;
  }
}

function extractSoapEnvelope(rawResponse: string): string {
  const withoutBom = rawResponse.replace(/^\uFEFF/, "");
  const prefixedEnvelope = /(?:<\?xml[^?]*\?>\s*)?<([A-Za-z_][\w.-]*):Envelope\b[\s\S]*<\/\1:Envelope>/i.exec(withoutBom);

  if (prefixedEnvelope?.[0]) {
    return prefixedEnvelope[0];
  }

  const unprefixedEnvelope = /(?:<\?xml[^?]*\?>\s*)?<Envelope\b[\s\S]*<\/Envelope>/i.exec(withoutBom);

  if (unprefixedEnvelope?.[0]) {
    return unprefixedEnvelope[0];
  }

  return withoutBom;
}

function createHttpError(status: number, statusText: string, body: string): Error {
  const message = statusText ? `SOAP HTTP request failed with status ${status}: ${statusText}` : `SOAP HTTP request failed with status ${status}`;
  const error = new Error(message);
  Object.assign(error, { body, status });
  return error;
}

function createSoapFaultError(fault: unknown): Error {
  if (!isRecord(fault)) {
    return new Error("SOAP Fault");
  }

  const faultCode = getFaultValue(fault, "faultcode") ?? getNestedFaultValue(fault, ["Code", "Value"]);
  const faultString = getFaultValue(fault, "faultstring") ?? getNestedFaultValue(fault, ["Reason", "Text"]);
  const detail = getFaultValue(fault, "detail") ?? fault.Detail;
  const message = [faultCode, faultString].filter((value) => typeof value === "string" && value.length > 0).join(": ") || "SOAP Fault";
  const error = new Error(detail === undefined ? message : `${message}: ${JSON.stringify(detail)}`);
  Object.assign(error, { fault });
  return error;
}

function getFaultValue(fault: Record<string, unknown>, key: string): unknown {
  const value = fault[key];

  if (isRecord(value) && "$value" in value) {
    return value.$value;
  }

  return value;
}

function getNestedFaultValue(fault: Record<string, unknown>, path: string[]): unknown {
  let value: unknown = fault;

  for (const key of path) {
    if (!isRecord(value)) {
      return undefined;
    }

    value = value[key];
  }

  return isRecord(value) && "$value" in value ? value.$value : value;
}

function responseHeadersToObject(headers: Headers): Record<string, string> {
  const object: Record<string, string> = {};

  headers.forEach((value, key) => {
    object[key] = value;
  });

  return object;
}

function isNilNode(node: XmlNode): boolean {
  for (const [name, value] of Object.entries(node.attributes)) {
    if ((name === "nil" || name.endsWith(":nil")) && (value.toLowerCase() === "true" || value === "1")) {
      return true;
    }
  }

  return false;
}

function nonNamespaceAttributes(node: XmlNode): Record<string, string> {
  const attributes: Record<string, string> = {};

  for (const [name, value] of Object.entries(node.attributes)) {
    if (!isXmlNamespaceAttribute(name)) {
      attributes[name] = value;
    }
  }

  return attributes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
