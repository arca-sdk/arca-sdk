import { describe, expect, it, vi } from "vitest";
import { ArcaAuthError, createArcaClient, normalizeCuit, resolveAuthTicket } from "../src";
import { WsfeClient } from "../src/wsfe/client";
import type { SoapClientFactory, SoapClientLike } from "../src/soap";

function createFakeSoapClient(methods: Record<string, unknown>): SoapClientLike {
  return {
    setEndpoint: vi.fn(),
    ...methods,
  };
}

describe("normalizeCuit", () => {
  it("accepts CUIT strings with separators", () => {
    expect(normalizeCuit("20-12345678-6")).toBe(20_123_456_786);
  });

  it("rejects values that do not have 11 digits", () => {
    expect(() => normalizeCuit("123")).toThrow("CUIT must contain exactly 11 digits");
  });
});

describe("resolveAuthTicket", () => {
  it("resolves static token/sign auth", async () => {
    await expect(resolveAuthTicket({ token: "token", sign: "sign" })).resolves.toEqual({
      token: "token",
      sign: "sign",
    });
  });

  it("validates token/sign values", async () => {
    await expect(resolveAuthTicket({ token: "", sign: "sign" })).rejects.toBeInstanceOf(ArcaAuthError);
  });
});

describe("WsfeClient", () => {
  it("injects Auth into authenticated WSFE calls", async () => {
    const FECompUltimoAutorizadoAsync = vi.fn(async (request: unknown) => [
      {
        FECompUltimoAutorizadoResult: {
          PtoVta: 1,
          CbteTipo: 6,
          CbteNro: 42,
        },
      },
    ]);

    const fakeSoapClient = createFakeSoapClient({ FECompUltimoAutorizadoAsync });
    const factory = vi.fn<SoapClientFactory>(async () => fakeSoapClient);
    const client = new WsfeClient(
      {
        auth: { token: "token", sign: "sign" },
        cuit: "20-12345678-6",
        endpoint: "https://example.test/wsfev1/service.asmx",
        wsdl: "./wsdl/wsfev1.homo.wsdl",
      },
      factory,
    );

    const result = await client.FECompUltimoAutorizado({ PtoVta: 1, CbteTipo: 6 });

    expect(result.CbteNro).toBe(42);
    expect(FECompUltimoAutorizadoAsync).toHaveBeenCalledWith({
      Auth: {
        Token: "token",
        Sign: "sign",
        Cuit: 20_123_456_786,
      },
      PtoVta: 1,
      CbteTipo: 6,
    });
  });

  it("does not request Auth for FEDummy", async () => {
    const auth = vi.fn(() => ({ token: "token", sign: "sign" }));
    const FEDummyAsync = vi.fn(async (request: unknown) => [
      {
        FEDummyResult: {
          AppServer: "OK",
          DbServer: "OK",
          AuthServer: "OK",
        },
      },
    ]);

    const fakeSoapClient = createFakeSoapClient({ FEDummyAsync });
    const factory = vi.fn<SoapClientFactory>(async () => fakeSoapClient);
    const client = new WsfeClient(
      {
        auth,
        cuit: 20_123_456_786,
        endpoint: "https://example.test/wsfev1/service.asmx",
        wsdl: "./wsdl/wsfev1.homo.wsdl",
      },
      factory,
    );

    const result = await client.FEDummy();

    expect(result).toEqual({ AppServer: "OK", DbServer: "OK", AuthServer: "OK" });
    expect(FEDummyAsync).toHaveBeenCalledWith({});
    expect(auth).not.toHaveBeenCalled();
  });
});

describe("createArcaClient", () => {
  it("creates a WSFE client using homologacion by default", () => {
    const client = createArcaClient({
      auth: { token: "token", sign: "sign" },
      cuit: 20_123_456_786,
    });

    expect(client.wsfe).toBeInstanceOf(WsfeClient);
  });
});
