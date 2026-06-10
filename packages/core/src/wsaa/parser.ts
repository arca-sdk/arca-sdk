import { ArcaAuthError } from "../errors";
import type { WsaaLoginTicketResponse } from "./types";

export function parseWsaaLoginTicketResponse(xml: string): WsaaLoginTicketResponse {
  const rawXml = ensurePlainXml(xml);
  const generationTime = parseRequiredDate(rawXml, "generationTime");
  const expirationTime = parseRequiredDate(rawXml, "expirationTime");
  const token = getRequiredTag(rawXml, "token");
  const sign = getRequiredTag(rawXml, "sign");

  const header: WsaaLoginTicketResponse["header"] = {
    generationTime,
    expirationTime,
  };
  const source = getOptionalTag(rawXml, "source");
  const destination = getOptionalTag(rawXml, "destination");
  const uniqueId = getOptionalTag(rawXml, "uniqueId");

  if (source !== undefined) {
    header.source = source;
  }

  if (destination !== undefined) {
    header.destination = destination;
  }

  if (uniqueId !== undefined) {
    header.uniqueId = uniqueId;
  }

  return {
    header,
    token,
    sign,
    rawXml,
  };
}

function ensurePlainXml(value: string): string {
  if (value.includes("<loginTicketResponse")) {
    return value;
  }

  const decoded = decodeXmlEntities(value);

  if (decoded.includes("<loginTicketResponse")) {
    return decoded;
  }

  throw new ArcaAuthError("WSAA loginCmsReturn did not contain a loginTicketResponse XML document.");
}

function parseRequiredDate(xml: string, tagName: string): Date {
  const value = getRequiredTag(xml, tagName);
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ArcaAuthError(`WSAA response field ${tagName} is not a valid date.`);
  }

  return date;
}

function getRequiredTag(xml: string, tagName: string): string {
  const value = getOptionalTag(xml, tagName);

  if (value === undefined || value.length === 0) {
    throw new ArcaAuthError(`WSAA response is missing ${tagName}.`);
  }

  return value;
}

function getOptionalTag(xml: string, tagName: string): string | undefined {
  const pattern = new RegExp(`<(?:[A-Za-z_][\\w.-]*:)?${tagName}\\b[^>]*>([\\s\\S]*?)</(?:[A-Za-z_][\\w.-]*:)?${tagName}>`);
  const match = pattern.exec(xml);

  if (!match?.[1]) {
    return undefined;
  }

  return decodeXmlEntities(match[1].trim());
}

function decodeXmlEntities(value: string): string {
  return value.replaceAll(/&(#x[\da-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_entity, code: string) => {
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
