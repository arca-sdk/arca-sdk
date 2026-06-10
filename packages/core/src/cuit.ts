import { ArcaConfigurationError } from "./errors";

export type ArcaCuit = number | string;

export function normalizeCuit(cuit: ArcaCuit): number {
  const digits = typeof cuit === "number" ? String(cuit) : cuit.replaceAll(/\D/g, "");

  if (!/^\d{11}$/.test(digits)) {
    throw new ArcaConfigurationError("CUIT must contain exactly 11 digits.");
  }

  const normalized = Number(digits);

  if (!Number.isSafeInteger(normalized)) {
    throw new ArcaConfigurationError("CUIT must be a safe integer.");
  }

  return normalized;
}
