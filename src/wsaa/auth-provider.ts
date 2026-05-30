import { resolveArcaEnvironment } from "../environments";
import type { ArcaAuthProvider, ArcaResolvedAuthTicket } from "../auth";
import { createWsaaTicketCacheKey } from "./cache";
import { WsaaClient, type WsaaClientOptions } from "./client";
import type { WsaaAuthProviderOptions } from "./types";

const DEFAULT_WSAA_SERVICE = "wsfe";
const DEFAULT_REFRESH_MARGIN_MS = 0;

export function createWsaaAuthProvider(options: WsaaAuthProviderOptions): ArcaAuthProvider {
  const environment = resolveArcaEnvironment(options.environment);
  const service = options.service ?? DEFAULT_WSAA_SERVICE;
  const refreshMarginMs = options.refreshMarginMs ?? DEFAULT_REFRESH_MARGIN_MS;

  const clientOptions: WsaaClientOptions = {
    certificate: options.certificate,
    privateKey: options.privateKey,
    endpoint: options.wsaa?.endpoint ?? environment.wsaa.endpoint,
    wsdl: options.wsaa?.wsdl ?? environment.wsaa.wsdl,
  };

  if (options.privateKeyPassphrase !== undefined) {
    clientOptions.privateKeyPassphrase = options.privateKeyPassphrase;
  }

  if (options.wsaa?.soapOptions !== undefined) {
    clientOptions.soapOptions = options.wsaa.soapOptions;
  }

  if (options.generationTimeOffsetMs !== undefined) {
    clientOptions.generationTimeOffsetMs = options.generationTimeOffsetMs;
  }

  if (options.ticketTimeToLiveMs !== undefined) {
    clientOptions.ticketTimeToLiveMs = options.ticketTimeToLiveMs;
  }

  const client = new WsaaClient(clientOptions, options.soapClientFactory);
  const cacheKey = options.cache
    ? createWsaaTicketCacheKey({
        environmentName: environment.name,
        endpoint: clientOptions.endpoint,
        service,
        certificate: options.certificate,
      })
    : undefined;
  let cachedTicket: ArcaResolvedAuthTicket | undefined;

  return async () => {
    if (cachedTicket && !isTicketExpiring(cachedTicket, refreshMarginMs)) {
      return cachedTicket;
    }

    if (options.cache && cacheKey) {
      const persistedTicket = await options.cache.get(cacheKey);

      if (persistedTicket && !isTicketExpiring(persistedTicket, refreshMarginMs)) {
        cachedTicket = persistedTicket;
        return persistedTicket;
      }
    }

    const ticket = await client.login(service);
    cachedTicket = {
      token: ticket.token,
      sign: ticket.sign,
      expirationTime: ticket.header.expirationTime,
    };

    if (options.cache && cacheKey) {
      await options.cache.set(cacheKey, cachedTicket);
    }

    return cachedTicket;
  };
}

function isTicketExpiring(ticket: ArcaResolvedAuthTicket, refreshMarginMs: number): boolean {
  if (!ticket.expirationTime) {
    return true;
  }

  return ticket.expirationTime.getTime() - refreshMarginMs <= Date.now();
}
