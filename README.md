# arca-sdk

Type-safe TypeScript SDK for ARCA/AFIP web services.

This first version focuses on `wsfev1` and uses injectable `token`/`sign` authentication. WSAA certificate login can be added on top of the current auth provider interface later.

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
import { createArcaClient } from "arca-sdk";

const client = createArcaClient({
  environment: "homologacion",
  cuit: 20123456786,
  auth: async () => ({
    token: process.env.ARCA_TOKEN!,
    sign: process.env.ARCA_SIGN!,
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
import { createArcaClient, type FECAESolicitarRequest } from "arca-sdk";

const client = createArcaClient({
  environment: "homologacion",
  cuit: "20-12345678-6",
  auth: {
    token: "...",
    sign: "...",
  },
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

- `wsdl/wsfev1.homo.wsdl`
- `wsdl/wsfev1.prod.wsdl`

By default, the SDK uses those local WSDL files and explicitly points the SOAP client to the selected remote endpoint:

- homologación: `https://wswhomo.afip.gov.ar/wsfev1/service.asmx`
- production: `https://servicios1.afip.gov.ar/wsfev1/service.asmx`

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

This version expects a WSAA ticket provider and injects `Auth` automatically into authenticated WSFE calls.

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
