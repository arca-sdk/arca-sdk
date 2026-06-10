import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import forge from "node-forge";
import { describe, expect, it, vi } from "vitest";
import {
  createFileWsaaTicketCache,
  createWsaaAuthProvider,
  createWsaaLoginTicketRequestXml,
  parseWsaaLoginTicketResponse,
  signCms,
} from "../src";
import type { SoapClientFactory, SoapClientLike } from "../src/soap";
import type { LoginCmsSoapRequest } from "../src";

function createTestCertificatePair(): { certificate: string; privateKey: string } {
  const keys = forge.pki.rsa.generateKeyPair({ bits: 1024, workers: 0 });
  const certificate = forge.pki.createCertificate();

  certificate.publicKey = keys.publicKey;
  certificate.serialNumber = "01";
  certificate.validity.notBefore = new Date("2026-01-01T00:00:00.000Z");
  certificate.validity.notAfter = new Date("2027-01-01T00:00:00.000Z");
  certificate.setSubject([{ name: "commonName", value: "arca-sdk-test" }]);
  certificate.setIssuer([{ name: "commonName", value: "arca-sdk-test" }]);
  certificate.sign(keys.privateKey, forge.md.sha256.create());

  return {
    certificate: forge.pki.certificateToPem(certificate),
    privateKey: forge.pki.privateKeyToPem(keys.privateKey),
  };
}

function createFakeSoapClient(methods: Record<string, unknown>): SoapClientLike {
  return {
    setEndpoint: vi.fn(),
    ...methods,
  };
}

const loginCmsReturn = `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketResponse version="1.0">
  <header>
    <source>CN=test-source</source>
    <destination>CN=test-destination</destination>
    <uniqueId>123</uniqueId>
    <generationTime>2026-05-29T10:00:00.000Z</generationTime>
    <expirationTime>2099-05-29T22:00:00.000Z</expirationTime>
  </header>
  <credentials>
    <token>token-value</token>
    <sign>sign-value</sign>
  </credentials>
</loginTicketResponse>`;

describe("createWsaaLoginTicketRequestXml", () => {
  it("creates a WSAA login ticket request for a service", () => {
    const xml = createWsaaLoginTicketRequestXml({
      service: "wsfe",
      now: new Date("2026-05-29T12:00:00.000Z"),
      uniqueId: 123,
      generationTimeOffsetMs: 10 * 60 * 1000,
      ticketTimeToLiveMs: 60 * 60 * 1000,
    });

    expect(xml).toContain('<loginTicketRequest version="1.0">');
    expect(xml).toContain("<uniqueId>123</uniqueId>");
    expect(xml).toContain("<generationTime>2026-05-29T11:50:00.000Z</generationTime>");
    expect(xml).toContain("<expirationTime>2026-05-29T13:00:00.000Z</expirationTime>");
    expect(xml).toContain("<service>wsfe</service>");
  });
});

describe("signCms", () => {
  it("creates a base64 CMS payload", () => {
    const credentials = createTestCertificatePair();
    const signed = signCms("<loginTicketRequest />", credentials);

    expect(signed).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(signed.length).toBeGreaterThan(100);
  });
});

describe("parseWsaaLoginTicketResponse", () => {
  it("extracts credentials and expiration", () => {
    const ticket = parseWsaaLoginTicketResponse(loginCmsReturn);

    expect(ticket.token).toBe("token-value");
    expect(ticket.sign).toBe("sign-value");
    expect(ticket.header.uniqueId).toBe("123");
    expect(ticket.header.expirationTime.toISOString()).toBe("2099-05-29T22:00:00.000Z");
  });
});

describe("createWsaaAuthProvider", () => {
  it("logs in through WSAA and caches the ticket in memory", async () => {
    const credentials = createTestCertificatePair();
    const loginCmsAsync = vi.fn(async (request: LoginCmsSoapRequest) => {
      expect(request.in0).toMatch(/^[A-Za-z0-9+/=]+$/);
      return [{ loginCmsReturn }];
    });
    const fakeSoapClient = createFakeSoapClient({ loginCmsAsync });
    const factory = vi.fn<SoapClientFactory>(async () => fakeSoapClient);

    const authProvider = createWsaaAuthProvider({
      ...credentials,
      environment: "homologacion",
      soapClientFactory: factory,
    });

    await expect(authProvider()).resolves.toEqual({
      token: "token-value",
      sign: "sign-value",
      expirationTime: new Date("2099-05-29T22:00:00.000Z"),
    });
    await expect(authProvider()).resolves.toEqual({
      token: "token-value",
      sign: "sign-value",
      expirationTime: new Date("2099-05-29T22:00:00.000Z"),
    });

    expect(loginCmsAsync).toHaveBeenCalledTimes(1);
  });

  it("can persist the ticket across auth provider instances", async () => {
    const cacheDirectory = await mkdtemp(join(tmpdir(), "arca-sdk-wsaa-"));

    try {
      const credentials = createTestCertificatePair();
      const cache = createFileWsaaTicketCache(cacheDirectory);
      const loginCmsAsync = vi.fn(async () => [{ loginCmsReturn }]);
      const firstFactory = vi.fn<SoapClientFactory>(async () => createFakeSoapClient({ loginCmsAsync }));

      const firstAuthProvider = createWsaaAuthProvider({
        ...credentials,
        cache,
        environment: "homologacion",
        soapClientFactory: firstFactory,
      });

      await expect(firstAuthProvider()).resolves.toMatchObject({
        token: "token-value",
        sign: "sign-value",
      });

      const secondLoginCmsAsync = vi.fn(async () => {
        throw new Error("WSAA should not be called when the file cache has a valid ticket.");
      });
      const secondFactory = vi.fn<SoapClientFactory>(async () => createFakeSoapClient({ loginCmsAsync: secondLoginCmsAsync }));
      const secondAuthProvider = createWsaaAuthProvider({
        ...credentials,
        cache,
        environment: "homologacion",
        soapClientFactory: secondFactory,
      });

      await expect(secondAuthProvider()).resolves.toMatchObject({
        token: "token-value",
        sign: "sign-value",
      });
      expect(loginCmsAsync).toHaveBeenCalledTimes(1);
      expect(secondLoginCmsAsync).not.toHaveBeenCalled();
    } finally {
      await rm(cacheDirectory, { recursive: true, force: true });
    }
  });
});
