# arca-sdk

Type-safe TypeScript SDK for ARCA/AFIP web services.

This version focuses on `wsfev1` and supports both injectable `token`/`sign` authentication and WSAA certificate authentication.

## Runtime

- Node.js 20+
- ESM-only package
- Built with Vite 8 in library mode
- SOAP transport powered by [`soap`](https://www.npmjs.com/package/soap) (`node-soap`)

## Install

```sh
npm install arca-sdk
```

## Basic usage

```ts
import { readFileSync } from "node:fs";
import { createArcaClient, createFileWsaaTicketCache, createWsaaAuthProvider } from "arca-sdk";

const environment = "homologacion";

const client = createArcaClient({
  environment,
  cuit: 20123456786,
  auth: createWsaaAuthProvider({
    environment,
    service: "wsfe",
    certificate: readFileSync("./certs/certificate.crt", "utf8"),
    privateKey: readFileSync("./certs/private.key", "utf8"),
    cache: createFileWsaaTicketCache("./.arca-cache"),
  }),
});

const status = await client.wsfe.FEDummy();

const lastVoucher = await client.wsfe.FECompUltimoAutorizado({
  PtoVta: 1,
  CbteTipo: 6,
});
```

## Requesting CAE

```ts
import { readFileSync } from "node:fs";
import {
  createArcaClient,
  createFileWsaaTicketCache,
  createWsaaAuthProvider,
  type FECAESolicitarRequest,
} from "arca-sdk";

const environment = "homologacion";

const client = createArcaClient({
  environment,
  cuit: "20-12345678-6",
  auth: createWsaaAuthProvider({
    environment,
    service: "wsfe",
    certificate: readFileSync("./certs/certificate.crt", "utf8"),
    privateKey: readFileSync("./certs/private.key", "utf8"),
    cache: createFileWsaaTicketCache("./.arca-cache"),
  }),
});

const request: FECAESolicitarRequest = {
  FeCAEReq: {
    FeCabReq: {
      CantReg: 1,
      PtoVta: 1,
      CbteTipo: 6,
    },
    FeDetReq: {
      FECAEDetRequest: [
        {
          Concepto: 1,
          DocTipo: 80,
          DocNro: 20123456786,
          CbteDesde: 1,
          CbteHasta: 1,
          CbteFch: "20260529",
          ImpTotal: 121,
          ImpTotConc: 0,
          ImpNeto: 100,
          ImpOpEx: 0,
          ImpTrib: 0,
          ImpIVA: 21,
          MonId: "PES",
          MonCotiz: 1,
          Iva: {
            AlicIva: [
              {
                Id: 5,
                BaseImp: 100,
                Importe: 21,
              },
            ],
          },
        },
      ],
    },
  },
};

const response = await client.wsfe.FECAESolicitar(request);
```

## Environments and WSDL files

The package includes local WSDL snapshots:

- `wsdl/wsaa.homo.wsdl`
- `wsdl/wsaa.prod.wsdl`
- `wsdl/wsfev1.homo.wsdl`
- `wsdl/wsfev1.prod.wsdl`

By default, the SDK uses those local WSDL files and explicitly points the SOAP clients to the selected remote endpoints:

- WSAA homologación: `https://wsaahomo.afip.gov.ar/ws/services/LoginCms`
- WSAA production: `https://wsaa.afip.gov.ar/ws/services/LoginCms`
- WSFE homologación: `https://wswhomo.afip.gov.ar/wsfev1/service.asmx`
- WSFE production: `https://servicios1.afip.gov.ar/wsfev1/service.asmx`

You can override the WSDL or endpoint if needed:

```ts
const client = createArcaClient({
  environment: "production",
  cuit: 20123456786,
  auth: { token: "...", sign: "..." },
  wsfe: {
    wsdl: "/absolute/path/to/wsfev1.prod.wsdl",
    endpoint: "https://servicios1.afip.gov.ar/wsfev1/service.asmx",
  },
});
```

## Implemented WSFEv1 operations

All operations from the current `wsfev1` WSDL are exposed with official ARCA/AFIP names:

- `FECAESolicitar`
- `FECompTotXRequest`
- `FEDummy`
- `FECompUltimoAutorizado`
- `FECompConsultar`
- `FECAEARegInformativo`
- `FECAEASolicitar`
- `FECAEASinMovimientoConsultar`
- `FECAEASinMovimientoInformar`
- `FECAEAConsultar`
- `FEParamGetCotizacion`
- `FEParamGetTiposTributos`
- `FEParamGetTiposMonedas`
- `FEParamGetTiposIva`
- `FEParamGetTiposOpcional`
- `FEParamGetTiposConcepto`
- `FEParamGetPtosVenta`
- `FEParamGetTiposCbte`
- `FEParamGetCondicionIvaReceptor`
- `FEParamGetTiposDoc`
- `FEParamGetTiposPaises`
- `FEParamGetActividades`

Convenience aliases are also available for the most common calls:

- `client.wsfe.dummy()`
- `client.wsfe.requestCAE(...)`
- `client.wsfe.getLastVoucher(...)`
- `client.wsfe.consultVoucher(...)`

## Authentication model

The SDK injects `Auth` automatically into authenticated WSFE calls.

### WSAA certificate authentication

```ts
import { readFileSync } from "node:fs";
import { createFileWsaaTicketCache, createWsaaAuthProvider } from "arca-sdk";

const auth = createWsaaAuthProvider({
  environment: "homologacion",
  service: "wsfe",
  certificate: readFileSync("./certs/certificate.crt", "utf8"),
  privateKey: readFileSync("./certs/private.key", "utf8"),
  cache: createFileWsaaTicketCache("./.arca-cache"),
});

const ticket = await auth();

console.log(ticket.token);
console.log(ticket.sign);
console.log(ticket.expirationTime);
```

The provider always keeps an in-memory cache. If you pass `cache: createFileWsaaTicketCache("./.arca-cache")`, it also persists the TA across script executions, which avoids calling `loginCms` again while ARCA still has a valid TA for the certificate/service.

If your private key is encrypted, pass `privateKeyPassphrase`.

### External token/sign provider

```ts
const client = createArcaClient({
  cuit: 20123456786,
  auth: async () => ({
    token: "...",
    sign: "...",
    expirationTime: new Date("2026-05-30T00:00:00Z"),
  }),
});
```

`FEDummy` does not require auth and therefore does not call the auth provider.

## Development

```sh
npm install
npm run check
npm test
npm run build
```

## Notes

- ARCA business errors are returned in the typed response `Errors` fields. The SDK does not throw for those by default so callers can inspect the complete service response.
- Transport/client failures are wrapped in SDK error classes such as `ArcaSoapError` and `ArcaUnexpectedResponseError`.
