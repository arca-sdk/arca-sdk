import { ArcaAuthError, ArcaSdkError } from "../errors";
import {
  createNodeSoapClient,
  getSoapAsyncMethod,
  unwrapSoapAsyncResult,
  unwrapSoapEnvelopeResult,
  type SoapClientFactory,
  type SoapClientFactoryInput,
  type SoapOptions,
} from "../soap";
import { signCms, type SignCmsOptions } from "./cms";
import { createWsaaLoginTicketRequestXml } from "./login-ticket";
import { parseWsaaLoginTicketResponse } from "./parser";
import type {
  LoginCmsSoapResponseEnvelope,
  WsaaLoginTicketRequestOptions,
  WsaaLoginTicketResponse,
  WsaaServiceName,
} from "./types";

export interface WsaaClientOptions extends SignCmsOptions {
  endpoint: string;
  wsdl: string;
  soapOptions?: SoapOptions;
  generationTimeOffsetMs?: number;
  ticketTimeToLiveMs?: number;
}

export class WsaaClient {
  private soapClientPromise?: ReturnType<SoapClientFactory>;

  constructor(
    private readonly options: WsaaClientOptions,
    private readonly soapClientFactory: SoapClientFactory = createNodeSoapClient,
  ) {}

  async login(service: WsaaServiceName): Promise<WsaaLoginTicketResponse> {
    try {
      const now = new Date();
      const requestOptions: WsaaLoginTicketRequestOptions = {
        service,
        now,
        uniqueId: Math.floor(now.getTime() / 1000),
      };

      if (this.options.generationTimeOffsetMs !== undefined) {
        requestOptions.generationTimeOffsetMs = this.options.generationTimeOffsetMs;
      }

      if (this.options.ticketTimeToLiveMs !== undefined) {
        requestOptions.ticketTimeToLiveMs = this.options.ticketTimeToLiveMs;
      }

      const loginTicketRequestXml = createWsaaLoginTicketRequestXml(requestOptions);
      const signedCms = signCms(loginTicketRequestXml, this.options);
      const client = await this.getSoapClient();
      const loginCms = getSoapAsyncMethod(client, "loginCms");
      const rawResult = await loginCms({ in0: signedCms });
      const envelope = unwrapSoapAsyncResult<LoginCmsSoapResponseEnvelope>(rawResult);
      const loginCmsReturn = unwrapSoapEnvelopeResult<LoginCmsSoapResponseEnvelope, string>(
        envelope,
        "loginCmsReturn",
        "loginCms",
      );

      return parseWsaaLoginTicketResponse(loginCmsReturn);
    } catch (error) {
      if (error instanceof ArcaSdkError) {
        throw error;
      }

      throw new ArcaAuthError("WSAA loginCms failed.", {
        cause: error,
        endpoint: this.options.endpoint,
        operation: "loginCms",
      });
    }
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
}
