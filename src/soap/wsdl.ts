import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  findDescendants,
  findDirectChild,
  firstElement,
  getLocalName,
  parseXml,
  type XmlNode,
} from "./xml";
import type { SoapOptions } from "./transport";

export interface SchemaQName {
  localName: string;
  namespaceURI: string;
  prefix?: string;
}

export interface SchemaElement {
  name: string;
  namespaceURI: string;
  type?: SchemaQName;
  inlineType?: SchemaComplexType;
  maxOccurs?: string;
}

export interface SchemaComplexType {
  name?: string;
  namespaceURI: string;
  base?: SchemaQName;
  children: SchemaElement[];
}

export interface SoapOperation {
  name: string;
  soapAction: string;
  requestNamespaceURI: string;
  responseElementName: string;
}

export interface WsdlModel {
  targetNamespace: string;
  endpoint?: string;
  operations: Map<string, SoapOperation>;
  schemas: Map<string, SchemaModel>;
}

interface SchemaModel {
  namespaceURI: string;
  elements: Map<string, SchemaElement>;
  complexTypes: Map<string, SchemaComplexType>;
}

type NamespaceMap = Map<string, string>;

const WSDL_CACHE = new Map<string, WsdlModel>();
const XML_SCHEMA_NAMESPACE = "http://www.w3.org/2001/XMLSchema";

export async function loadWsdlModel(location: string, options: SoapOptions = {}): Promise<WsdlModel> {
  if (options.disableCache !== true) {
    const cached = WSDL_CACHE.get(location);

    if (cached) {
      return cached;
    }
  }

  const xml = await loadWsdlXml(location, options);
  const model = parseWsdlModel(xml);

  if (options.disableCache !== true) {
    WSDL_CACHE.set(location, model);
  }

  return model;
}

export function findGlobalElement(model: WsdlModel, name: string, namespaceURI?: string): SchemaElement | undefined {
  if (namespaceURI) {
    return model.schemas.get(namespaceURI)?.elements.get(name);
  }

  for (const schema of model.schemas.values()) {
    const element = schema.elements.get(name);

    if (element) {
      return element;
    }
  }

  return undefined;
}

export function resolveComplexType(model: WsdlModel, qname: SchemaQName): SchemaComplexType | undefined {
  if (isPrimitiveType(qname)) {
    return undefined;
  }

  return model.schemas.get(qname.namespaceURI)?.complexTypes.get(qname.localName);
}

export function resolveElementComplexType(model: WsdlModel, element: SchemaElement | undefined): SchemaComplexType | undefined {
  if (!element) {
    return undefined;
  }

  if (element.inlineType) {
    return element.inlineType;
  }

  if (!element.type) {
    return undefined;
  }

  return resolveComplexType(model, element.type);
}

export function getComplexTypeChildren(model: WsdlModel, complexType: SchemaComplexType | undefined): SchemaElement[] {
  if (!complexType) {
    return [];
  }

  const inheritedChildren = complexType.base ? getComplexTypeChildren(model, resolveComplexType(model, complexType.base)) : [];
  return [...inheritedChildren, ...complexType.children];
}

export function isArrayElement(element: SchemaElement | undefined): boolean {
  if (!element?.maxOccurs) {
    return false;
  }

  if (element.maxOccurs === "unbounded") {
    return true;
  }

  const maxOccurs = Number.parseInt(element.maxOccurs, 10);
  return Number.isFinite(maxOccurs) && maxOccurs > 1;
}

export function isPrimitiveType(qname: SchemaQName | undefined): boolean {
  return qname?.namespaceURI === XML_SCHEMA_NAMESPACE;
}

export function parsePrimitiveValue(value: string, qname: SchemaQName | undefined): unknown {
  if (!qname || !isPrimitiveType(qname)) {
    return value;
  }

  switch (qname.localName) {
    case "byte":
    case "decimal":
    case "double":
    case "float":
    case "int":
    case "integer":
    case "long":
    case "negativeInteger":
    case "nonNegativeInteger":
    case "nonPositiveInteger":
    case "positiveInteger":
    case "short":
    case "unsignedByte":
    case "unsignedInt":
    case "unsignedLong":
    case "unsignedShort":
      return Number(value);
    case "boolean":
    case "bool":
      return value.toLowerCase() === "true" || value === "1";
    case "date":
    case "dateTime":
      return new Date(value);
    default:
      return value;
  }
}

async function loadWsdlXml(location: string, options: SoapOptions): Promise<string> {
  if (isHttpUrl(location)) {
    const fetchImpl = options.fetch ?? globalThis.fetch;

    if (typeof fetchImpl !== "function") {
      throw new Error("A fetch implementation is required to load remote WSDL files.");
    }

    const requestInit: RequestInit = {
      method: "GET",
    };
    const headers = options.wsdlHeaders ?? options.wsdl_headers;

    if (headers !== undefined) {
      requestInit.headers = headers;
    }

    const response = await fetchImpl(location, requestInit);

    if (!response.ok) {
      throw new Error(`Failed to load WSDL ${location}: HTTP ${response.status}`);
    }

    return response.text();
  }

  return readFile(toFilePath(location), "utf8");
}

function parseWsdlModel(xml: string): WsdlModel {
  const document = parseXml(xml);
  const definitions = firstElement(document);

  if (!definitions || definitions.localName !== "definitions") {
    throw new Error("Invalid WSDL: missing definitions element.");
  }

  const targetNamespace = definitions.attributes.targetNamespace ?? "";
  const definitionNamespaces = collectNamespaceDeclarations(definitions);
  const schemas = parseSchemas(definitions, targetNamespace, definitionNamespaces);
  const model: WsdlModel = {
    targetNamespace,
    operations: new Map<string, SoapOperation>(),
    schemas,
  };
  const endpoint = findDescendants(definitions, "address").find((node) => typeof node.attributes.location === "string")?.attributes.location;

  if (endpoint !== undefined) {
    model.endpoint = endpoint;
  }

  model.operations = parseOperations(definitions, model);
  return model;
}

function parseSchemas(definitions: XmlNode, definitionsTargetNamespace: string, definitionNamespaces: NamespaceMap): Map<string, SchemaModel> {
  const schemas = new Map<string, SchemaModel>();

  for (const schemaNode of findDescendants(definitions, "schema")) {
    const namespaces = collectNamespaceDeclarations(schemaNode, definitionNamespaces);
    const namespaceURI = schemaNode.attributes.targetNamespace ?? definitionsTargetNamespace;
    const schema = getOrCreateSchema(schemas, namespaceURI);

    for (const child of schemaNode.children) {
      switch (child.localName) {
        case "element": {
          const element = parseSchemaElement(child, namespaceURI, namespaces);

          if (element) {
            schema.elements.set(element.name, element);
          }

          break;
        }
        case "complexType": {
          const complexType = parseComplexType(child, namespaceURI, namespaces);

          if (complexType.name) {
            schema.complexTypes.set(complexType.name, complexType);
          }

          break;
        }
        default:
          break;
      }
    }
  }

  return schemas;
}

function parseOperations(definitions: XmlNode, model: WsdlModel): Map<string, SoapOperation> {
  const operations = new Map<string, SoapOperation>();

  for (const operationNode of findDescendants(definitions, "operation")) {
    const name = operationNode.attributes.name;

    if (!name || operations.has(name)) {
      continue;
    }

    const soapOperation = operationNode.children.find((child) => child.localName === "operation" && "soapAction" in child.attributes);

    if (!soapOperation) {
      continue;
    }

    const requestElement = findGlobalElement(model, name);
    const responseElementName = findGlobalElement(model, `${name}Response`)?.name ?? `${name}Response`;
    operations.set(name, {
      name,
      soapAction: soapOperation.attributes.soapAction ?? "",
      requestNamespaceURI: requestElement?.namespaceURI ?? model.targetNamespace,
      responseElementName,
    });
  }

  return operations;
}

function parseSchemaElement(node: XmlNode, namespaceURI: string, namespaces: NamespaceMap): SchemaElement | undefined {
  const name = node.attributes.name ?? node.attributes.ref?.split(":").at(-1);

  if (!name) {
    return undefined;
  }

  const element: SchemaElement = {
    name,
    namespaceURI,
  };
  const type = node.attributes.type;
  const maxOccurs = node.attributes.maxOccurs;
  const inlineComplexTypeNode = findDirectChild(node, "complexType");

  if (type) {
    element.type = resolveQName(type, namespaces, namespaceURI);
  }

  if (maxOccurs !== undefined) {
    element.maxOccurs = maxOccurs;
  }

  if (inlineComplexTypeNode) {
    element.inlineType = parseComplexType(inlineComplexTypeNode, namespaceURI, namespaces);
  }

  return element;
}

function parseComplexType(node: XmlNode, namespaceURI: string, namespaces: NamespaceMap): SchemaComplexType {
  const complexType: SchemaComplexType = {
    namespaceURI,
    children: [],
  };
  const name = node.attributes.name;

  if (name !== undefined) {
    complexType.name = name;
  }

  const extension = findDirectChild(findDirectChild(node, "complexContent") ?? node, "extension");
  const sequence = findDirectChild(extension ?? node, "sequence");

  if (extension?.attributes.base) {
    complexType.base = resolveQName(extension.attributes.base, namespaces, namespaceURI);
  }

  if (sequence) {
    for (const child of sequence.children) {
      if (child.localName !== "element") {
        continue;
      }

      const element = parseSchemaElement(child, namespaceURI, namespaces);

      if (element) {
        complexType.children.push(element);
      }
    }
  }

  return complexType;
}

function resolveQName(value: string, namespaces: NamespaceMap, defaultNamespaceURI: string): SchemaQName {
  const separatorIndex = value.indexOf(":");

  if (separatorIndex === -1) {
    return {
      localName: value,
      namespaceURI: defaultNamespaceURI,
    };
  }

  const prefix = value.slice(0, separatorIndex);
  return {
    prefix,
    localName: value.slice(separatorIndex + 1),
    namespaceURI: namespaces.get(prefix) ?? defaultNamespaceURI,
  };
}

function collectNamespaceDeclarations(node: XmlNode, parentNamespaces?: NamespaceMap): NamespaceMap {
  const namespaces = new Map(parentNamespaces);

  for (const [name, value] of Object.entries(node.attributes)) {
    if (name === "xmlns") {
      namespaces.set("", value);
      continue;
    }

    if (name.startsWith("xmlns:")) {
      namespaces.set(getLocalName(name), value);
    }
  }

  return namespaces;
}

function getOrCreateSchema(schemas: Map<string, SchemaModel>, namespaceURI: string): SchemaModel {
  const existing = schemas.get(namespaceURI);

  if (existing) {
    return existing;
  }

  const schema: SchemaModel = {
    namespaceURI,
    elements: new Map<string, SchemaElement>(),
    complexTypes: new Map<string, SchemaComplexType>(),
  };
  schemas.set(namespaceURI, schema);
  return schema;
}

function toFilePath(location: string): string {
  if (location.startsWith("file://")) {
    return fileURLToPath(location);
  }

  return location;
}

function isHttpUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}
