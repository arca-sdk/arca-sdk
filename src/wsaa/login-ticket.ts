import type { WsaaLoginTicketRequestOptions } from "./types";

const DEFAULT_GENERATION_TIME_OFFSET_MS = 10 * 60 * 1000;
const DEFAULT_TICKET_TIME_TO_LIVE_MS = 12 * 60 * 60 * 1000;

export function createWsaaLoginTicketRequestXml(options: WsaaLoginTicketRequestOptions): string {
  const now = options.now ?? new Date();
  const uniqueId = options.uniqueId ?? Math.floor(now.getTime() / 1000);
  const generationTimeOffsetMs = options.generationTimeOffsetMs ?? DEFAULT_GENERATION_TIME_OFFSET_MS;
  const ticketTimeToLiveMs = options.ticketTimeToLiveMs ?? DEFAULT_TICKET_TIME_TO_LIVE_MS;

  const generationTime = new Date(now.getTime() - generationTimeOffsetMs);
  const expirationTime = new Date(now.getTime() + ticketTimeToLiveMs);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<loginTicketRequest version="1.0">',
    "  <header>",
    `    <uniqueId>${uniqueId}</uniqueId>`,
    `    <generationTime>${generationTime.toISOString()}</generationTime>`,
    `    <expirationTime>${expirationTime.toISOString()}</expirationTime>`,
    "  </header>",
    `  <service>${escapeXmlText(options.service)}</service>`,
    "</loginTicketRequest>",
  ].join("\n");
}

function escapeXmlText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
