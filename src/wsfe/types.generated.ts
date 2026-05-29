/*
 * TypeScript DTOs derived from wsdl/wsfev1.homo.wsdl.
 * Keep names aligned with ARCA/AFIP's WSFEv1 WSDL for easy lookup in official docs.
 */

export type ArcaDateString = string;
export type ArcaDateTimeString = string;
export type ArcaInt = number;
export type ArcaShort = number;
export type ArcaLong = number;
export type ArcaDouble = number;

export interface FEAuthRequest {
  Token?: string;
  Sign?: string;
  Cuit: ArcaLong;
}

export interface FECAERequest {
  FeCabReq?: FECAECabRequest;
  FeDetReq?: ArrayOfFECAEDetRequest;
}

export interface FECAECabRequest extends FECabRequest {}

export interface FECabRequest {
  CantReg: ArcaInt;
  PtoVta: ArcaInt;
  CbteTipo: ArcaInt;
}

export interface ArrayOfFECAEDetRequest {
  FECAEDetRequest?: FECAEDetRequest[];
}

export interface FECAEDetRequest extends FEDetRequest {}

export interface FEDetRequest {
  Concepto: ArcaInt;
  DocTipo: ArcaInt;
  DocNro: ArcaLong;
  CbteDesde: ArcaLong;
  CbteHasta: ArcaLong;
  CbteFch?: ArcaDateString;
  ImpTotal: ArcaDouble;
  ImpTotConc: ArcaDouble;
  ImpNeto: ArcaDouble;
  ImpOpEx: ArcaDouble;
  ImpTrib: ArcaDouble;
  ImpIVA: ArcaDouble;
  FchServDesde?: ArcaDateString;
  FchServHasta?: ArcaDateString;
  FchVtoPago?: ArcaDateString;
  MonId?: string;
  MonCotiz?: ArcaDouble;
  CanMisMonExt?: string;
  CondicionIVAReceptorId?: ArcaInt;
  CbtesAsoc?: ArrayOfCbteAsoc;
  Tributos?: ArrayOfTributo;
  Iva?: ArrayOfAlicIva;
  Opcionales?: ArrayOfOpcional;
  Compradores?: ArrayOfComprador;
  PeriodoAsoc?: Periodo;
  Actividades?: ArrayOfActividad;
}

export interface ArrayOfCbteAsoc {
  CbteAsoc?: CbteAsoc[];
}

export interface CbteAsoc {
  Tipo: ArcaInt;
  PtoVta: ArcaInt;
  Nro: ArcaLong;
  Cuit?: string;
  CbteFch?: ArcaDateString;
}

export interface ArrayOfTributo {
  Tributo?: Tributo[];
}

export interface Tributo {
  Id: ArcaShort;
  Desc?: string;
  BaseImp: ArcaDouble;
  Alic: ArcaDouble;
  Importe: ArcaDouble;
}

export interface ArrayOfAlicIva {
  AlicIva?: AlicIva[];
}

export interface AlicIva {
  Id: ArcaInt;
  BaseImp: ArcaDouble;
  Importe: ArcaDouble;
}

export interface ArrayOfOpcional {
  Opcional?: Opcional[];
}

export interface Opcional {
  Id?: string;
  Valor?: string;
}

export interface ArrayOfComprador {
  Comprador?: Comprador[];
}

export interface Comprador {
  DocTipo: ArcaInt;
  DocNro: ArcaLong;
  Porcentaje: ArcaDouble;
}

export interface Periodo {
  FchDesde?: ArcaDateString;
  FchHasta?: ArcaDateString;
}

export interface ArrayOfActividad {
  Actividad?: Actividad[];
}

export interface Actividad {
  Id: ArcaLong;
}

export interface FECAEResponse {
  FeCabResp?: FECAECabResponse;
  FeDetResp?: ArrayOfFECAEDetResponse;
  Events?: ArrayOfEvt;
  Errors?: ArrayOfErr;
}

export interface FECAECabResponse extends FECabResponse {}

export interface FECabResponse {
  Cuit: ArcaLong;
  PtoVta: ArcaInt;
  CbteTipo: ArcaInt;
  FchProceso?: ArcaDateTimeString;
  CantReg: ArcaInt;
  Resultado?: string;
  Reproceso?: string;
}

export interface ArrayOfFECAEDetResponse {
  FECAEDetResponse?: FECAEDetResponse[];
}

export interface FECAEDetResponse extends FEDetResponse {
  CAE?: string;
  CAEFchVto?: ArcaDateString;
}

export interface FEDetResponse {
  Concepto: ArcaInt;
  DocTipo: ArcaInt;
  DocNro: ArcaLong;
  CbteDesde: ArcaLong;
  CbteHasta: ArcaLong;
  CbteFch?: ArcaDateString;
  Resultado?: string;
  Observaciones?: ArrayOfObs;
}

export interface ArrayOfObs {
  Obs?: Obs[];
}

export interface Obs {
  Code: ArcaInt;
  Msg?: string;
}

export interface ArrayOfEvt {
  Evt?: Evt[];
}

export interface Evt {
  Code: ArcaInt;
  Msg?: string;
}

export interface ArrayOfErr {
  Err?: Err[];
}

export interface Err {
  Code: ArcaInt;
  Msg?: string;
}

export interface FERegXReqResponse {
  RegXReq: ArcaInt;
  Errors?: ArrayOfErr;
  Events?: ArrayOfEvt;
}

export interface DummyResponse {
  AppServer?: string;
  DbServer?: string;
  AuthServer?: string;
}

export interface FERecuperaLastCbteResponse {
  PtoVta: ArcaInt;
  CbteTipo: ArcaInt;
  CbteNro: ArcaInt;
  Errors?: ArrayOfErr;
  Events?: ArrayOfEvt;
}

export interface FECompConsultaReq {
  CbteTipo: ArcaInt;
  CbteNro: ArcaLong;
  PtoVta: ArcaInt;
}

export interface FECompConsultaResponse {
  ResultGet?: FECompConsResponse;
  Errors?: ArrayOfErr;
  Events?: ArrayOfEvt;
}

export interface FECompConsResponse extends FECAEDetRequest {
  Resultado?: string;
  CodAutorizacion?: string;
  EmisionTipo?: string;
  FchVto?: ArcaDateString;
  FchProceso?: ArcaDateTimeString;
  Observaciones?: ArrayOfObs;
  PtoVta: ArcaInt;
  CbteTipo: ArcaInt;
}

export interface FECAEARequest {
  FeCabReq?: FECAEACabRequest;
  FeDetReq?: ArrayOfFECAEADetRequest;
}

export interface FECAEACabRequest extends FECabRequest {}

export interface ArrayOfFECAEADetRequest {
  FECAEADetRequest?: FECAEADetRequest[];
}

export interface FECAEADetRequest extends FEDetRequest {
  CAEA?: string;
  CbteFchHsGen?: ArcaDateTimeString;
}

export interface FECAEAResponse {
  FeCabResp?: FECAEACabResponse;
  FeDetResp?: ArrayOfFECAEADetResponse;
  Events?: ArrayOfEvt;
  Errors?: ArrayOfErr;
}

export interface FECAEACabResponse extends FECabResponse {}

export interface ArrayOfFECAEADetResponse {
  FECAEADetResponse?: FECAEADetResponse[];
}

export interface FECAEADetResponse extends FEDetResponse {
  CAEA?: string;
}

export interface FECAEAGetResponse {
  ResultGet?: FECAEAGet;
  Errors?: ArrayOfErr;
  Events?: ArrayOfEvt;
}

export interface FECAEAGet {
  CAEA?: string;
  Periodo: ArcaInt;
  Orden: ArcaShort;
  FchVigDesde?: ArcaDateString;
  FchVigHasta?: ArcaDateString;
  FchTopeInf?: ArcaDateString;
  FchProceso?: ArcaDateTimeString;
  Observaciones?: ArrayOfObs;
}

export interface FECAEASinMovConsResponse {
  ResultGet?: ArrayOfFECAEASinMov;
  Errors?: ArrayOfErr;
  Events?: ArrayOfEvt;
}

export interface ArrayOfFECAEASinMov {
  FECAEASinMov?: FECAEASinMov[];
}

export interface FECAEASinMov {
  CAEA?: string;
  FchProceso?: ArcaDateTimeString;
  PtoVta: ArcaInt;
}

export interface FECAEASinMovResponse extends FECAEASinMov {
  Resultado?: string;
  Errors?: ArrayOfErr;
  Events?: ArrayOfEvt;
}

export interface FECotizacionResponse {
  ResultGet?: Cotizacion;
  Errors?: ArrayOfErr;
  Events?: ArrayOfEvt;
}

export interface Cotizacion {
  MonId?: string;
  MonCotiz: ArcaDouble;
  FchCotiz?: ArcaDateString;
}

export interface FETributoResponse {
  ResultGet?: ArrayOfTributoTipo;
  Errors?: ArrayOfErr;
  Events?: ArrayOfEvt;
}

export interface ArrayOfTributoTipo {
  TributoTipo?: TributoTipo[];
}

export interface TributoTipo {
  Id: ArcaShort;
  Desc?: string;
  FchDesde?: ArcaDateString;
  FchHasta?: ArcaDateString;
}

export interface MonedaResponse {
  ResultGet?: ArrayOfMoneda;
  Errors?: ArrayOfErr;
  Events?: ArrayOfEvt;
}

export interface ArrayOfMoneda {
  Moneda?: Moneda[];
}

export interface Moneda {
  Id?: string;
  Desc?: string;
  FchDesde?: ArcaDateString;
  FchHasta?: ArcaDateString;
}

export interface IvaTipoResponse {
  ResultGet?: ArrayOfIvaTipo;
  Errors?: ArrayOfErr;
  Events?: ArrayOfEvt;
}

export interface ArrayOfIvaTipo {
  IvaTipo?: IvaTipo[];
}

export interface IvaTipo {
  Id?: string;
  Desc?: string;
  FchDesde?: ArcaDateString;
  FchHasta?: ArcaDateString;
}

export interface OpcionalTipoResponse {
  ResultGet?: ArrayOfOpcionalTipo;
  Errors?: ArrayOfErr;
  Events?: ArrayOfEvt;
}

export interface ArrayOfOpcionalTipo {
  OpcionalTipo?: OpcionalTipo[];
}

export interface OpcionalTipo {
  Id?: string;
  Desc?: string;
  FchDesde?: ArcaDateString;
  FchHasta?: ArcaDateString;
}

export interface ConceptoTipoResponse {
  ResultGet?: ArrayOfConceptoTipo;
  Errors?: ArrayOfErr;
  Events?: ArrayOfEvt;
}

export interface ArrayOfConceptoTipo {
  ConceptoTipo?: ConceptoTipo[];
}

export interface ConceptoTipo {
  Id: ArcaInt;
  Desc?: string;
  FchDesde?: ArcaDateString;
  FchHasta?: ArcaDateString;
}

export interface FEPtoVentaResponse {
  ResultGet?: ArrayOfPtoVenta;
  Errors?: ArrayOfErr;
  Events?: ArrayOfEvt;
}

export interface ArrayOfPtoVenta {
  PtoVenta?: PtoVenta[];
}

export interface PtoVenta {
  Nro: ArcaInt;
  EmisionTipo?: string;
  Bloqueado?: string;
  FchBaja?: ArcaDateString;
}

export interface CbteTipoResponse {
  ResultGet?: ArrayOfCbteTipo;
  Errors?: ArrayOfErr;
  Events?: ArrayOfEvt;
}

export interface ArrayOfCbteTipo {
  CbteTipo?: CbteTipo[];
}

export interface CbteTipo {
  Id: ArcaInt;
  Desc?: string;
  FchDesde?: ArcaDateString;
  FchHasta?: ArcaDateString;
}

export interface CondicionIvaReceptorResponse {
  ResultGet?: ArrayOfCondicionIvaReceptor;
  Errors?: ArrayOfErr;
  Events?: ArrayOfEvt;
}

export interface ArrayOfCondicionIvaReceptor {
  CondicionIvaReceptor?: CondicionIvaReceptor[];
}

export interface CondicionIvaReceptor {
  Id: ArcaInt;
  Desc?: string;
  Cmp_Clase?: string;
}

export interface DocTipoResponse {
  ResultGet?: ArrayOfDocTipo;
  Errors?: ArrayOfErr;
  Events?: ArrayOfEvt;
}

export interface ArrayOfDocTipo {
  DocTipo?: DocTipo[];
}

export interface DocTipo {
  Id: ArcaInt;
  Desc?: string;
  FchDesde?: ArcaDateString;
  FchHasta?: ArcaDateString;
}

export interface FEPaisResponse {
  ResultGet?: ArrayOfPaisTipo;
  Errors?: ArrayOfErr;
  Events?: ArrayOfEvt;
}

export interface ArrayOfPaisTipo {
  PaisTipo?: PaisTipo[];
}

export interface PaisTipo {
  Id: ArcaShort;
  Desc?: string;
}

export interface FEActividadesResponse {
  ResultGet?: ArrayOfActividadesTipo;
  Errors?: ArrayOfErr;
  Events?: ArrayOfEvt;
}

export interface ArrayOfActividadesTipo {
  ActividadesTipo?: ActividadesTipo[];
}

export interface ActividadesTipo {
  Id: ArcaLong;
  Orden: ArcaShort;
  Desc?: string;
}

export interface FECAESolicitarSoapRequest {
  Auth?: FEAuthRequest;
  FeCAEReq?: FECAERequest;
}

export interface FECAESolicitarSoapResponseEnvelope {
  FECAESolicitarResult?: FECAEResponse;
}

export type FECAESolicitarRequest = Omit<FECAESolicitarSoapRequest, "Auth">;
export type FECAESolicitarResponse = FECAEResponse;

export interface FECompTotXRequestSoapRequest {
  Auth?: FEAuthRequest;
}

export interface FECompTotXRequestSoapResponseEnvelope {
  FECompTotXRequestResult?: FERegXReqResponse;
}

export type FECompTotXRequestResponse = FERegXReqResponse;

export interface FEDummySoapResponseEnvelope {
  FEDummyResult?: DummyResponse;
}

export type FEDummyResponse = DummyResponse;

export interface FECompUltimoAutorizadoSoapRequest {
  Auth?: FEAuthRequest;
  PtoVta: ArcaInt;
  CbteTipo: ArcaInt;
}

export interface FECompUltimoAutorizadoSoapResponseEnvelope {
  FECompUltimoAutorizadoResult?: FERecuperaLastCbteResponse;
}

export type FECompUltimoAutorizadoRequest = Omit<FECompUltimoAutorizadoSoapRequest, "Auth">;
export type FECompUltimoAutorizadoResponse = FERecuperaLastCbteResponse;

export interface FECompConsultarSoapRequest {
  Auth?: FEAuthRequest;
  FeCompConsReq?: FECompConsultaReq;
}

export interface FECompConsultarSoapResponseEnvelope {
  FECompConsultarResult?: FECompConsultaResponse;
}

export type FECompConsultarRequest = Omit<FECompConsultarSoapRequest, "Auth">;
export type FECompConsultarResponse = FECompConsultaResponse;

export interface FECAEARegInformativoSoapRequest {
  Auth?: FEAuthRequest;
  FeCAEARegInfReq?: FECAEARequest;
}

export interface FECAEARegInformativoSoapResponseEnvelope {
  FECAEARegInformativoResult?: FECAEAResponse;
}

export type FECAEARegInformativoRequest = Omit<FECAEARegInformativoSoapRequest, "Auth">;
export type FECAEARegInformativoResponse = FECAEAResponse;

export interface FECAEASolicitarSoapRequest {
  Auth?: FEAuthRequest;
  Periodo: ArcaInt;
  Orden: ArcaShort;
}

export interface FECAEASolicitarSoapResponseEnvelope {
  FECAEASolicitarResult?: FECAEAGetResponse;
}

export type FECAEASolicitarRequest = Omit<FECAEASolicitarSoapRequest, "Auth">;
export type FECAEASolicitarResponse = FECAEAGetResponse;

export interface FECAEASinMovimientoConsultarSoapRequest {
  Auth?: FEAuthRequest;
  CAEA?: string;
  PtoVta: ArcaInt;
}

export interface FECAEASinMovimientoConsultarSoapResponseEnvelope {
  FECAEASinMovimientoConsultarResult?: FECAEASinMovConsResponse;
}

export type FECAEASinMovimientoConsultarRequest = Omit<FECAEASinMovimientoConsultarSoapRequest, "Auth">;
export type FECAEASinMovimientoConsultarResponse = FECAEASinMovConsResponse;

export interface FECAEASinMovimientoInformarSoapRequest {
  Auth?: FEAuthRequest;
  PtoVta: ArcaInt;
  CAEA?: string;
}

export interface FECAEASinMovimientoInformarSoapResponseEnvelope {
  FECAEASinMovimientoInformarResult?: FECAEASinMovResponse;
}

export type FECAEASinMovimientoInformarRequest = Omit<FECAEASinMovimientoInformarSoapRequest, "Auth">;
export type FECAEASinMovimientoInformarResponse = FECAEASinMovResponse;

export interface FECAEAConsultarSoapRequest {
  Auth?: FEAuthRequest;
  Periodo: ArcaInt;
  Orden: ArcaShort;
}

export interface FECAEAConsultarSoapResponseEnvelope {
  FECAEAConsultarResult?: FECAEAGetResponse;
}

export type FECAEAConsultarRequest = Omit<FECAEAConsultarSoapRequest, "Auth">;
export type FECAEAConsultarResponse = FECAEAGetResponse;

export interface FEParamGetCotizacionSoapRequest {
  Auth?: FEAuthRequest;
  MonId?: string;
  FchCotiz?: ArcaDateString;
}

export interface FEParamGetCotizacionSoapResponseEnvelope {
  FEParamGetCotizacionResult?: FECotizacionResponse;
}

export type FEParamGetCotizacionRequest = Omit<FEParamGetCotizacionSoapRequest, "Auth">;
export type FEParamGetCotizacionResponse = FECotizacionResponse;

export interface FEParamGetTiposTributosSoapRequest {
  Auth?: FEAuthRequest;
}

export interface FEParamGetTiposTributosSoapResponseEnvelope {
  FEParamGetTiposTributosResult?: FETributoResponse;
}

export type FEParamGetTiposTributosResponse = FETributoResponse;

export interface FEParamGetTiposMonedasSoapRequest {
  Auth?: FEAuthRequest;
}

export interface FEParamGetTiposMonedasSoapResponseEnvelope {
  FEParamGetTiposMonedasResult?: MonedaResponse;
}

export type FEParamGetTiposMonedasResponse = MonedaResponse;

export interface FEParamGetTiposIvaSoapRequest {
  Auth?: FEAuthRequest;
}

export interface FEParamGetTiposIvaSoapResponseEnvelope {
  FEParamGetTiposIvaResult?: IvaTipoResponse;
}

export type FEParamGetTiposIvaResponse = IvaTipoResponse;

export interface FEParamGetTiposOpcionalSoapRequest {
  Auth?: FEAuthRequest;
}

export interface FEParamGetTiposOpcionalSoapResponseEnvelope {
  FEParamGetTiposOpcionalResult?: OpcionalTipoResponse;
}

export type FEParamGetTiposOpcionalResponse = OpcionalTipoResponse;

export interface FEParamGetTiposConceptoSoapRequest {
  Auth?: FEAuthRequest;
}

export interface FEParamGetTiposConceptoSoapResponseEnvelope {
  FEParamGetTiposConceptoResult?: ConceptoTipoResponse;
}

export type FEParamGetTiposConceptoResponse = ConceptoTipoResponse;

export interface FEParamGetPtosVentaSoapRequest {
  Auth?: FEAuthRequest;
}

export interface FEParamGetPtosVentaSoapResponseEnvelope {
  FEParamGetPtosVentaResult?: FEPtoVentaResponse;
}

export type FEParamGetPtosVentaResponse = FEPtoVentaResponse;

export interface FEParamGetTiposCbteSoapRequest {
  Auth?: FEAuthRequest;
}

export interface FEParamGetTiposCbteSoapResponseEnvelope {
  FEParamGetTiposCbteResult?: CbteTipoResponse;
}

export type FEParamGetTiposCbteResponse = CbteTipoResponse;

export interface FEParamGetCondicionIvaReceptorSoapRequest {
  Auth?: FEAuthRequest;
  ClaseCmp?: string;
}

export interface FEParamGetCondicionIvaReceptorSoapResponseEnvelope {
  FEParamGetCondicionIvaReceptorResult?: CondicionIvaReceptorResponse;
}

export type FEParamGetCondicionIvaReceptorRequest = Omit<FEParamGetCondicionIvaReceptorSoapRequest, "Auth">;
export type FEParamGetCondicionIvaReceptorResponse = CondicionIvaReceptorResponse;

export interface FEParamGetTiposDocSoapRequest {
  Auth?: FEAuthRequest;
}

export interface FEParamGetTiposDocSoapResponseEnvelope {
  FEParamGetTiposDocResult?: DocTipoResponse;
}

export type FEParamGetTiposDocResponse = DocTipoResponse;

export interface FEParamGetTiposPaisesSoapRequest {
  Auth?: FEAuthRequest;
}

export interface FEParamGetTiposPaisesSoapResponseEnvelope {
  FEParamGetTiposPaisesResult?: FEPaisResponse;
}

export type FEParamGetTiposPaisesResponse = FEPaisResponse;

export interface FEParamGetActividadesSoapRequest {
  Auth?: FEAuthRequest;
}

export interface FEParamGetActividadesSoapResponseEnvelope {
  FEParamGetActividadesResult?: FEActividadesResponse;
}

export type FEParamGetActividadesResponse = FEActividadesResponse;

export type WsfeOperationName =
  | "FECAESolicitar"
  | "FECompTotXRequest"
  | "FEDummy"
  | "FECompUltimoAutorizado"
  | "FECompConsultar"
  | "FECAEARegInformativo"
  | "FECAEASolicitar"
  | "FECAEASinMovimientoConsultar"
  | "FECAEASinMovimientoInformar"
  | "FECAEAConsultar"
  | "FEParamGetCotizacion"
  | "FEParamGetTiposTributos"
  | "FEParamGetTiposMonedas"
  | "FEParamGetTiposIva"
  | "FEParamGetTiposOpcional"
  | "FEParamGetTiposConcepto"
  | "FEParamGetPtosVenta"
  | "FEParamGetTiposCbte"
  | "FEParamGetCondicionIvaReceptor"
  | "FEParamGetTiposDoc"
  | "FEParamGetTiposPaises"
  | "FEParamGetActividades";
