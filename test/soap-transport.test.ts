import { describe, expect, it, vi } from "vitest";
import { createNodeSoapClient, getSoapAsyncMethod, unwrapSoapAsyncResult } from "../src/soap";

const wsfeResponse = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <FECompUltimoAutorizadoResponse xmlns="http://ar.gov.afip.dif.FEV1/">
      <FECompUltimoAutorizadoResult>
        <PtoVta>1</PtoVta>
        <CbteTipo>6</CbteTipo>
        <CbteNro>42</CbteNro>
        <Errors>
          <Err>
            <Code>100</Code>
            <Msg>sample error</Msg>
          </Err>
        </Errors>
      </FECompUltimoAutorizadoResult>
    </FECompUltimoAutorizadoResponse>
  </soap:Body>
</soap:Envelope>`;

const wsaaResponse = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <loginCmsResponse xmlns="http://wsaa.view.sua.dvadac.desein.afip.gov">
      <loginCmsReturn>&lt;loginTicketResponse&gt;&lt;credentials&gt;&lt;token&gt;token&lt;/token&gt;&lt;sign&gt;sign&lt;/sign&gt;&lt;/credentials&gt;&lt;/loginTicketResponse&gt;</loginCmsReturn>
    </loginCmsResponse>
  </soapenv:Body>
</soapenv:Envelope>`;

describe("local SOAP transport", () => {
  it("creates node-soap-compatible Async methods over native fetch", async () => {
    const fetchMock = vi.fn(async () => new Response(wsfeResponse, { status: 200 })) as unknown as typeof fetch;
    const client = await createNodeSoapClient({
      endpoint: "https://example.test/wsfev1/service.asmx",
      options: { fetch: fetchMock, disableCache: true },
      wsdl: "./wsdl/wsfev1.homo.wsdl",
    });
    const method = getSoapAsyncMethod(client, "FECompUltimoAutorizado");

    const rawResult = await method({
      Auth: { Token: "token", Sign: "sign", Cuit: 20_123_456_786 },
      CbteTipo: 6,
      PtoVta: 1,
    });
    const [url, init] = vi.mocked(fetchMock).mock.calls[0] ?? [];
    const requestXml = init?.body?.toString() ?? "";
    const envelope = unwrapSoapAsyncResult<Record<string, any>>(rawResult);

    expect(url).toBe("https://example.test/wsfev1/service.asmx");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({ SOAPAction: '"http://ar.gov.afip.dif.FEV1/FECompUltimoAutorizado"' });
    expect(requestXml).toContain("<tns:FECompUltimoAutorizado");
    expect(requestXml).toContain("<Cuit>20123456786</Cuit>");
    expect(envelope.FECompUltimoAutorizadoResult).toMatchObject({
      CbteNro: 42,
      CbteTipo: 6,
      PtoVta: 1,
    });
    expect(envelope.FECompUltimoAutorizadoResult.Errors.Err).toEqual([{ Code: 100, Msg: "sample error" }]);
  });

  it("supports WSAA loginCms and decodes escaped XML response values", async () => {
    const fetchMock = vi.fn(async () => new Response(wsaaResponse, { status: 200 })) as unknown as typeof fetch;
    const client = await createNodeSoapClient({
      endpoint: "https://example.test/ws/services/LoginCms",
      options: { fetch: fetchMock, disableCache: true },
      wsdl: "./wsdl/wsaa.homo.wsdl",
    });
    const loginCms = getSoapAsyncMethod(client, "loginCms");

    const envelope = unwrapSoapAsyncResult<Record<string, string>>(await loginCms({ in0: "signed-cms" }));
    const [, init] = vi.mocked(fetchMock).mock.calls[0] ?? [];
    const requestXml = init?.body?.toString() ?? "";

    expect(init?.headers).toMatchObject({ SOAPAction: '""' });
    expect(requestXml).toContain("<tns:loginCms");
    expect(requestXml).toContain("<in0>signed-cms</in0>");
    expect(envelope.loginCmsReturn).toContain("<loginTicketResponse>");
  });
});
