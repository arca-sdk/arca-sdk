import { ArcaAuthError } from "../errors";
import type { ArcaAuthInput, ArcaAuthProvider, ArcaAuthTicket, ArcaResolvedAuthTicket } from "./types";

export function isArcaAuthProvider(auth: ArcaAuthInput): auth is ArcaAuthProvider {
  return typeof auth === "function";
}

export function createStaticAuthProvider(ticket: ArcaAuthTicket): ArcaAuthProvider {
  return () => ticket;
}

export async function resolveAuthTicket(auth: ArcaAuthInput): Promise<ArcaResolvedAuthTicket> {
  const ticket = isArcaAuthProvider(auth) ? await auth() : auth;

  if (!ticket || typeof ticket.token !== "string" || ticket.token.length === 0) {
    throw new ArcaAuthError("ARCA auth provider must return a non-empty token.");
  }

  if (typeof ticket.sign !== "string" || ticket.sign.length === 0) {
    throw new ArcaAuthError("ARCA auth provider must return a non-empty sign.");
  }

  const resolved: ArcaResolvedAuthTicket = {
    token: ticket.token,
    sign: ticket.sign,
  };

  if (ticket.expirationTime !== undefined) {
    const expirationTime = ticket.expirationTime instanceof Date ? ticket.expirationTime : new Date(ticket.expirationTime);

    if (Number.isNaN(expirationTime.getTime())) {
      throw new ArcaAuthError("ARCA auth ticket expirationTime must be a valid Date or date string.");
    }

    resolved.expirationTime = expirationTime;
  }

  return resolved;
}
