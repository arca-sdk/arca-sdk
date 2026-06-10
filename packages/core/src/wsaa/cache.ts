import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { ArcaAuthError } from "../errors";
import type { ArcaResolvedAuthTicket } from "../auth";
import type { WsaaPemInput, WsaaServiceName } from "./types";

export interface WsaaTicketCacheKey {
  environmentName: string;
  endpoint: string;
  service: WsaaServiceName;
  certificateFingerprint: string;
}

export interface WsaaTicketCache {
  get(key: WsaaTicketCacheKey): Promise<ArcaResolvedAuthTicket | undefined>;
  set(key: WsaaTicketCacheKey, ticket: ArcaResolvedAuthTicket): Promise<void>;
}

export interface WsaaFileTicketCacheOptions {
  directory: string;
}

interface StoredWsaaTicket {
  key: WsaaTicketCacheKey;
  token: string;
  sign: string;
  expirationTime?: string;
  createdAt: string;
}

export function createFileWsaaTicketCache(options: WsaaFileTicketCacheOptions | string): WsaaTicketCache {
  const directory = resolve(typeof options === "string" ? options : options.directory);

  return {
    async get(key) {
      const path = getCacheFilePath(directory, key);
      let content: string;

      try {
        content = await readFile(path, "utf8");
      } catch (cause) {
        if (isNodeError(cause) && cause.code === "ENOENT") {
          return undefined;
        }

        throw new ArcaAuthError("Unable to read WSAA ticket cache.", { cause });
      }

      return parseStoredTicket(content);
    },

    async set(key, ticket) {
      const path = getCacheFilePath(directory, key);
      const tempPath = `${path}.${process.pid}.${Date.now()}.tmp`;
      const stored: StoredWsaaTicket = {
        key,
        token: ticket.token,
        sign: ticket.sign,
        createdAt: new Date().toISOString(),
      };

      if (ticket.expirationTime !== undefined) {
        stored.expirationTime = ticket.expirationTime.toISOString();
      }

      try {
        await mkdir(directory, { recursive: true, mode: 0o700 });
        await writeFile(tempPath, `${JSON.stringify(stored, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
        await rename(tempPath, path);
      } catch (cause) {
        throw new ArcaAuthError("Unable to write WSAA ticket cache.", { cause });
      }
    },
  };
}

export function createWsaaTicketCacheKey(input: {
  environmentName: string;
  endpoint: string;
  service: WsaaServiceName;
  certificate: WsaaPemInput;
}): WsaaTicketCacheKey {
  return {
    environmentName: input.environmentName,
    endpoint: input.endpoint,
    service: input.service,
    certificateFingerprint: fingerprint(input.certificate),
  };
}

function getCacheFilePath(directory: string, key: WsaaTicketCacheKey): string {
  const endpointFingerprint = fingerprint(key.endpoint).slice(0, 16);
  const filename = [
    sanitizeForFilename(key.environmentName),
    sanitizeForFilename(key.service),
    endpointFingerprint,
    key.certificateFingerprint.slice(0, 16),
  ].join("-");

  return join(directory, `${filename}.json`);
}

function parseStoredTicket(content: string): ArcaResolvedAuthTicket | undefined {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    return undefined;
  }

  if (!isStoredWsaaTicket(parsed)) {
    return undefined;
  }

  const ticket: ArcaResolvedAuthTicket = {
    token: parsed.token,
    sign: parsed.sign,
  };

  if (parsed.expirationTime !== undefined) {
    const expirationTime = new Date(parsed.expirationTime);

    if (Number.isNaN(expirationTime.getTime())) {
      return undefined;
    }

    ticket.expirationTime = expirationTime;
  }

  return ticket;
}

function isStoredWsaaTicket(value: unknown): value is StoredWsaaTicket {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoredWsaaTicket>;

  return (
    typeof candidate.token === "string" &&
    candidate.token.length > 0 &&
    typeof candidate.sign === "string" &&
    candidate.sign.length > 0 &&
    (candidate.expirationTime === undefined || typeof candidate.expirationTime === "string")
  );
}

function fingerprint(value: WsaaPemInput | string): string {
  const content = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
  return createHash("sha256").update(content).digest("hex");
}

function sanitizeForFilename(value: string): string {
  return value.replaceAll(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 80);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
