import { resolveAuthTicket } from "../auth";
import { normalizeCuit, type ArcaCuit } from "../cuit";
import { ArcaSdkError, ArcaSoapError } from "../errors";
import {
  createNodeSoapClient,
  getSoapAsyncMethod,
  unwrapSoapAsyncResult,
  unwrapSoapEnvelopeResult,
  type SoapClientFactory,
  type SoapClientFactoryInput,
  type SoapOptions,
} from "../soap";
import type { ArcaAuthInput } from "../auth";
import type * as WsfeTypes from "./types.generated";

export interface WsfeClientOptions {
  cuit: ArcaCuit;
  auth: ArcaAuthInput;
  endpoint: string;
  wsdl: string;
  soapOptions?: SoapOptions;
}

export class WsfeClient {
  private readonly cuit: number;
  private readonly soapClientFactory: SoapClientFactory;
  private soapClientPromise?: ReturnType<SoapClientFactory>;

  constructor(
    private readonly options: WsfeClientOptions,
    soapClientFactory: SoapClientFactory = createNodeSoapClient,
  ) {
    this.cuit = normalizeCuit(options.cuit);
    this.soapClientFactory = soapClientFactory;
  }

  async FEDummy(): Promise<WsfeTypes.FEDummyResponse> {
    return this.callWithoutAuth<WsfeTypes.FEDummySoapResponseEnvelope, WsfeTypes.FEDummyResponse>(
      "FEDummy",
      "FEDummyResult",
    );
  }

  async FECAESolicitar(request: WsfeTypes.FECAESolicitarRequest): Promise<WsfeTypes.FECAESolicitarResponse> {
    return this.callWithAuth<
      WsfeTypes.FECAESolicitarRequest,
      WsfeTypes.FECAESolicitarSoapResponseEnvelope,
      WsfeTypes.FECAESolicitarResponse
    >("FECAESolicitar", request, "FECAESolicitarResult");
  }

  async FECompTotXRequest(): Promise<WsfeTypes.FECompTotXRequestResponse> {
    return this.callWithAuth<Record<string, never>, WsfeTypes.FECompTotXRequestSoapResponseEnvelope, WsfeTypes.FECompTotXRequestResponse>(
      "FECompTotXRequest",
      {},
      "FECompTotXRequestResult",
    );
  }

  async FECompUltimoAutorizado(
    request: WsfeTypes.FECompUltimoAutorizadoRequest,
  ): Promise<WsfeTypes.FECompUltimoAutorizadoResponse> {
    return this.callWithAuth<
      WsfeTypes.FECompUltimoAutorizadoRequest,
      WsfeTypes.FECompUltimoAutorizadoSoapResponseEnvelope,
      WsfeTypes.FECompUltimoAutorizadoResponse
    >("FECompUltimoAutorizado", request, "FECompUltimoAutorizadoResult");
  }

  async FECompConsultar(request: WsfeTypes.FECompConsultarRequest): Promise<WsfeTypes.FECompConsultarResponse> {
    return this.callWithAuth<
      WsfeTypes.FECompConsultarRequest,
      WsfeTypes.FECompConsultarSoapResponseEnvelope,
      WsfeTypes.FECompConsultarResponse
    >("FECompConsultar", request, "FECompConsultarResult");
  }

  async FECAEARegInformativo(
    request: WsfeTypes.FECAEARegInformativoRequest,
  ): Promise<WsfeTypes.FECAEARegInformativoResponse> {
    return this.callWithAuth<
      WsfeTypes.FECAEARegInformativoRequest,
      WsfeTypes.FECAEARegInformativoSoapResponseEnvelope,
      WsfeTypes.FECAEARegInformativoResponse
    >("FECAEARegInformativo", request, "FECAEARegInformativoResult");
  }

  async FECAEASolicitar(request: WsfeTypes.FECAEASolicitarRequest): Promise<WsfeTypes.FECAEASolicitarResponse> {
    return this.callWithAuth<
      WsfeTypes.FECAEASolicitarRequest,
      WsfeTypes.FECAEASolicitarSoapResponseEnvelope,
      WsfeTypes.FECAEASolicitarResponse
    >("FECAEASolicitar", request, "FECAEASolicitarResult");
  }

  async FECAEASinMovimientoConsultar(
    request: WsfeTypes.FECAEASinMovimientoConsultarRequest,
  ): Promise<WsfeTypes.FECAEASinMovimientoConsultarResponse> {
    return this.callWithAuth<
      WsfeTypes.FECAEASinMovimientoConsultarRequest,
      WsfeTypes.FECAEASinMovimientoConsultarSoapResponseEnvelope,
      WsfeTypes.FECAEASinMovimientoConsultarResponse
    >("FECAEASinMovimientoConsultar", request, "FECAEASinMovimientoConsultarResult");
  }

  async FECAEASinMovimientoInformar(
    request: WsfeTypes.FECAEASinMovimientoInformarRequest,
  ): Promise<WsfeTypes.FECAEASinMovimientoInformarResponse> {
    return this.callWithAuth<
      WsfeTypes.FECAEASinMovimientoInformarRequest,
      WsfeTypes.FECAEASinMovimientoInformarSoapResponseEnvelope,
      WsfeTypes.FECAEASinMovimientoInformarResponse
    >("FECAEASinMovimientoInformar", request, "FECAEASinMovimientoInformarResult");
  }

  async FECAEAConsultar(request: WsfeTypes.FECAEAConsultarRequest): Promise<WsfeTypes.FECAEAConsultarResponse> {
    return this.callWithAuth<
      WsfeTypes.FECAEAConsultarRequest,
      WsfeTypes.FECAEAConsultarSoapResponseEnvelope,
      WsfeTypes.FECAEAConsultarResponse
    >("FECAEAConsultar", request, "FECAEAConsultarResult");
  }

  async FEParamGetCotizacion(
    request: WsfeTypes.FEParamGetCotizacionRequest = {},
  ): Promise<WsfeTypes.FEParamGetCotizacionResponse> {
    return this.callWithAuth<
      WsfeTypes.FEParamGetCotizacionRequest,
      WsfeTypes.FEParamGetCotizacionSoapResponseEnvelope,
      WsfeTypes.FEParamGetCotizacionResponse
    >("FEParamGetCotizacion", request, "FEParamGetCotizacionResult");
  }

  async FEParamGetTiposTributos(): Promise<WsfeTypes.FEParamGetTiposTributosResponse> {
    return this.callWithAuth<Record<string, never>, WsfeTypes.FEParamGetTiposTributosSoapResponseEnvelope, WsfeTypes.FEParamGetTiposTributosResponse>(
      "FEParamGetTiposTributos",
      {},
      "FEParamGetTiposTributosResult",
    );
  }

  async FEParamGetTiposMonedas(): Promise<WsfeTypes.FEParamGetTiposMonedasResponse> {
    return this.callWithAuth<Record<string, never>, WsfeTypes.FEParamGetTiposMonedasSoapResponseEnvelope, WsfeTypes.FEParamGetTiposMonedasResponse>(
      "FEParamGetTiposMonedas",
      {},
      "FEParamGetTiposMonedasResult",
    );
  }

  async FEParamGetTiposIva(): Promise<WsfeTypes.FEParamGetTiposIvaResponse> {
    return this.callWithAuth<Record<string, never>, WsfeTypes.FEParamGetTiposIvaSoapResponseEnvelope, WsfeTypes.FEParamGetTiposIvaResponse>(
      "FEParamGetTiposIva",
      {},
      "FEParamGetTiposIvaResult",
    );
  }

  async FEParamGetTiposOpcional(): Promise<WsfeTypes.FEParamGetTiposOpcionalResponse> {
    return this.callWithAuth<Record<string, never>, WsfeTypes.FEParamGetTiposOpcionalSoapResponseEnvelope, WsfeTypes.FEParamGetTiposOpcionalResponse>(
      "FEParamGetTiposOpcional",
      {},
      "FEParamGetTiposOpcionalResult",
    );
  }

  async FEParamGetTiposConcepto(): Promise<WsfeTypes.FEParamGetTiposConceptoResponse> {
    return this.callWithAuth<Record<string, never>, WsfeTypes.FEParamGetTiposConceptoSoapResponseEnvelope, WsfeTypes.FEParamGetTiposConceptoResponse>(
      "FEParamGetTiposConcepto",
      {},
      "FEParamGetTiposConceptoResult",
    );
  }

  async FEParamGetPtosVenta(): Promise<WsfeTypes.FEParamGetPtosVentaResponse> {
    return this.callWithAuth<Record<string, never>, WsfeTypes.FEParamGetPtosVentaSoapResponseEnvelope, WsfeTypes.FEParamGetPtosVentaResponse>(
      "FEParamGetPtosVenta",
      {},
      "FEParamGetPtosVentaResult",
    );
  }

  async FEParamGetTiposCbte(): Promise<WsfeTypes.FEParamGetTiposCbteResponse> {
    return this.callWithAuth<Record<string, never>, WsfeTypes.FEParamGetTiposCbteSoapResponseEnvelope, WsfeTypes.FEParamGetTiposCbteResponse>(
      "FEParamGetTiposCbte",
      {},
      "FEParamGetTiposCbteResult",
    );
  }

  async FEParamGetCondicionIvaReceptor(
    request: WsfeTypes.FEParamGetCondicionIvaReceptorRequest = {},
  ): Promise<WsfeTypes.FEParamGetCondicionIvaReceptorResponse> {
    return this.callWithAuth<
      WsfeTypes.FEParamGetCondicionIvaReceptorRequest,
      WsfeTypes.FEParamGetCondicionIvaReceptorSoapResponseEnvelope,
      WsfeTypes.FEParamGetCondicionIvaReceptorResponse
    >("FEParamGetCondicionIvaReceptor", request, "FEParamGetCondicionIvaReceptorResult");
  }

  async FEParamGetTiposDoc(): Promise<WsfeTypes.FEParamGetTiposDocResponse> {
    return this.callWithAuth<Record<string, never>, WsfeTypes.FEParamGetTiposDocSoapResponseEnvelope, WsfeTypes.FEParamGetTiposDocResponse>(
      "FEParamGetTiposDoc",
      {},
      "FEParamGetTiposDocResult",
    );
  }

  async FEParamGetTiposPaises(): Promise<WsfeTypes.FEParamGetTiposPaisesResponse> {
    return this.callWithAuth<Record<string, never>, WsfeTypes.FEParamGetTiposPaisesSoapResponseEnvelope, WsfeTypes.FEParamGetTiposPaisesResponse>(
      "FEParamGetTiposPaises",
      {},
      "FEParamGetTiposPaisesResult",
    );
  }

  async FEParamGetActividades(): Promise<WsfeTypes.FEParamGetActividadesResponse> {
    return this.callWithAuth<Record<string, never>, WsfeTypes.FEParamGetActividadesSoapResponseEnvelope, WsfeTypes.FEParamGetActividadesResponse>(
      "FEParamGetActividades",
      {},
      "FEParamGetActividadesResult",
    );
  }

  async dummy(): Promise<WsfeTypes.FEDummyResponse> {
    return this.FEDummy();
  }

  async requestCAE(request: WsfeTypes.FECAESolicitarRequest): Promise<WsfeTypes.FECAESolicitarResponse> {
    return this.FECAESolicitar(request);
  }

  async getLastVoucher(
    request: WsfeTypes.FECompUltimoAutorizadoRequest,
  ): Promise<WsfeTypes.FECompUltimoAutorizadoResponse> {
    return this.FECompUltimoAutorizado(request);
  }

  async consultVoucher(request: WsfeTypes.FECompConsultarRequest): Promise<WsfeTypes.FECompConsultarResponse> {
    return this.FECompConsultar(request);
  }

  private async getSoapClient(): ReturnType<SoapClientFactory> {
    if (!this.soapClientPromise) {
      const input: SoapClientFactoryInput = {
        endpoint: this.options.endpoint,
        wsdl: this.options.wsdl,
      };

      if (this.options.soapOptions !== undefined) {
        input.options = this.options.soapOptions;
      }

      this.soapClientPromise = this.soapClientFactory(input);
    }

    return this.soapClientPromise;
  }

  private async createAuthRequest(): Promise<WsfeTypes.FEAuthRequest> {
    const ticket = await resolveAuthTicket(this.options.auth);

    return {
      Token: ticket.token,
      Sign: ticket.sign,
      Cuit: this.cuit,
    };
  }

  private async callWithAuth<TRequest extends object, TEnvelope extends object, TResult>(
    operation: WsfeTypes.WsfeOperationName,
    request: TRequest,
    resultKey: keyof TEnvelope & string,
  ): Promise<TResult> {
    const auth = await this.createAuthRequest();
    return this.call<TEnvelope, TResult>(operation, { Auth: auth, ...request }, resultKey);
  }

  private async callWithoutAuth<TEnvelope extends object, TResult>(
    operation: WsfeTypes.WsfeOperationName,
    resultKey: keyof TEnvelope & string,
  ): Promise<TResult> {
    return this.call<TEnvelope, TResult>(operation, {}, resultKey);
  }

  private async call<TEnvelope extends object, TResult>(
    operation: WsfeTypes.WsfeOperationName,
    soapRequest: object,
    resultKey: keyof TEnvelope & string,
  ): Promise<TResult> {
    try {
      const client = await this.getSoapClient();
      const method = getSoapAsyncMethod(client, operation);
      const rawResult = await method(soapRequest);
      const envelope = unwrapSoapAsyncResult<TEnvelope>(rawResult);

      return unwrapSoapEnvelopeResult<TEnvelope, TResult>(envelope, resultKey, operation);
    } catch (error) {
      if (error instanceof ArcaSdkError) {
        throw error;
      }

      throw new ArcaSoapError(`SOAP operation ${operation} failed.`, {
        cause: error,
        endpoint: this.options.endpoint,
        operation,
      });
    }
  }
}
