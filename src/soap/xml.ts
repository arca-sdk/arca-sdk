import { DOMParser, type Document, type Element, type Node } from "@xmldom/xmldom";

export interface XmlNode {
  name: string;
  localName: string;
  attributes: Record<string, string>;
  children: XmlNode[];
  text: string;
}

const XML_ENTITY_PATTERN = /&(#x[\da-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g;

export function parseXml(xml: string): XmlNode {
  const errors: string[] = [];
  const document = new DOMParser({
    onError: (level, message) => {
      if (level !== "warning") {
        errors.push(message);
      }
    },
  }).parseFromString(xml, "text/xml");

  if (errors.length > 0) {
    throw new Error(`Invalid XML: ${errors.join("; ")}`);
  }

  return createDocumentNode(document);
}

export function firstElement(node: XmlNode): XmlNode | undefined {
  return node.children[0];
}

export function findDirectChild(node: XmlNode, localName: string): XmlNode | undefined {
  return node.children.find((child) => child.localName === localName);
}

export function findDirectChildren(node: XmlNode, localName: string): XmlNode[] {
  return node.children.filter((child) => child.localName === localName);
}

export function findDescendants(node: XmlNode, localName: string): XmlNode[] {
  const matches: XmlNode[] = [];

  for (const child of node.children) {
    if (child.localName === localName) {
      matches.push(child);
    }

    matches.push(...findDescendants(child, localName));
  }

  return matches;
}

export function getLocalName(name: string): string {
  const separatorIndex = name.indexOf(":");
  return separatorIndex === -1 ? name : name.slice(separatorIndex + 1);
}

export function decodeXmlEntities(value: string): string {
  return value.replaceAll(XML_ENTITY_PATTERN, (_entity, code: string) => {
    switch (code) {
      case "amp":
        return "&";
      case "lt":
        return "<";
      case "gt":
        return ">";
      case "quot":
        return '"';
      case "apos":
        return "'";
      default:
        if (code.startsWith("#x")) {
          return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
        }

        if (code.startsWith("#")) {
          return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
        }

        return `&${code};`;
    }
  });
}

export function escapeXml(value: unknown): string {
  if (typeof value !== "string") {
    return String(value);
  }

  if (value.startsWith("<![CDATA[") && value.endsWith("]]>")) {
    return value;
  }

  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function isXmlNamespaceAttribute(attributeName: string): boolean {
  return attributeName === "xmlns" || attributeName.startsWith("xmlns:");
}

function createDocumentNode(document: Document): XmlNode {
  return {
    name: "#document",
    localName: "#document",
    attributes: {},
    children: getElementChildren(document),
    text: "",
  };
}

function createElementNode(element: Element): XmlNode {
  return {
    name: element.tagName,
    localName: element.localName || getLocalName(element.tagName),
    attributes: getAttributes(element),
    children: getElementChildren(element),
    text: getDirectText(element),
  };
}

function getElementChildren(node: Node): XmlNode[] {
  const children: XmlNode[] = [];

  for (let index = 0; index < node.childNodes.length; index += 1) {
    const child = node.childNodes.item(index);

    if (child?.nodeType === 1) {
      children.push(createElementNode(child as Element));
    }
  }

  return children;
}

function getAttributes(element: Element): Record<string, string> {
  const attributes: Record<string, string> = {};

  for (let index = 0; index < element.attributes.length; index += 1) {
    const attribute = element.attributes.item(index);

    if (attribute) {
      attributes[attribute.name] = attribute.value;
    }
  }

  return attributes;
}

function getDirectText(element: Element): string {
  let text = "";

  for (let index = 0; index < element.childNodes.length; index += 1) {
    const child = element.childNodes.item(index);

    if (child?.nodeType === 3 || child?.nodeType === 4) {
      text += child.nodeValue ?? "";
    }
  }

  return text;
}
