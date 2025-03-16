import { Client, createClientAsync } from "soap";
import * as fs from "node:fs/promises";
import { AccessTicket } from "./AccessTicket";
import { Builder, parseStringPromise } from "xml2js";
import { Cryptography } from "./CryptData";
import { resolve } from "node:path";

const WSFE = "wsfe";

export class Arca {
  private readonly certificate: string;
  private readonly privateKey: string;
  private readonly cuit: number;
  constructor({
    certificate,
    privateKey,
    cuit,
  }: {
    certificate: string;
    privateKey: string;
    cuit: number;
  }) {
    this.certificate = certificate;
    this.privateKey = privateKey;
    this.cuit = cuit;
  }

  async crearComprobante() {
    const client = await createClientAsync(
      resolve(import.meta.dirname, "wsdl/wsfev1homo.wsdl"),
      {
        disableCache: true,
        forceSoap12Headers: true,
      },
      "https://wswhomo.afip.gov.ar/wsfev1/service.asmx",
    );
    const accessTicket = await this.login();
    const [output] = await client.FEParamGetTiposCbteAsync({
      Auth: {
        Token: accessTicket.getToken(),
        Sign: accessTicket.getSign(),
        Cuit: this.cuit,
      },
    });
    return output;
  }

  async getAccessTicketFromLocalFilesystem() {
    const filePath = `./credentials/TA-${this.cuit}-wsfe.json`;
    try {
      await fs.access(filePath, fs.constants.F_OK);
    } catch (error) {
      return undefined;
    }
    await fs.access(filePath, fs.constants.R_OK);
    const fileData = await fs.readFile(filePath, "utf8");

    return new AccessTicket(JSON.parse(fileData));
  }

  async login() {
    let accessTicket = await this.getAccessTicketFromLocalFilesystem();

    if (!accessTicket || accessTicket.isExpired()) {
      accessTicket = await this.requestLogin();
      await this.saveAccessTicketToLocalFilesystem(accessTicket);
    }

    return accessTicket;
  }

  async saveAccessTicketToLocalFilesystem(ticket: AccessTicket): Promise<void> {
    await fs.mkdir(resolve(import.meta.dirname, "credentials"), { recursive: true });

    const filePath = `./credentials/TA-${this.cuit}-wsfe.json`;
    await fs.writeFile(filePath, JSON.stringify(ticket), "utf8");
  }

  private async requestLogin() {
    // Create amd sign TRA
    const traXml = new Builder().buildObject(this.getTRA());
    const signedTRA = this.signTRA(traXml);

    // Request TR
    const client = await createClientAsync(
      resolve(import.meta.dirname, "wsdl/wsaahomo.wsdl"),
      {
        disableCache: true,
        forceSoap12Headers: true,
      },
      "https://wsaahomo.afip.gov.ar/ws/services/LoginCms",
    );
    const [loginCmsResult] = await client.loginCmsAsync({ in0: signedTRA });
    const loginReturn = await parseStringPromise(
      loginCmsResult.loginCmsReturn,
      {
        normalizeTags: true,
        normalize: true,
        explicitArray: false,
        attrkey: "header",
        tagNameProcessors: [(key: string) => key.replace("soapenv:", "")],
      },
    );

    return new AccessTicket(loginReturn.loginticketresponse);
  }

  private signTRA(traXml: string): string {
    const crypto = new Cryptography(this.certificate, this.privateKey);
    return crypto.sign(traXml);
  }

  private getTRA() {
    const date = new Date();
    return {
      loginTicketRequest: {
        $: { version: "1.0" },
        header: [
          {
            uniqueId: [Math.floor(date.getTime() / 1000)],
            generationTime: [new Date(date.getTime() - 600000).toISOString()],
            expirationTime: [new Date(date.getTime() + 600000).toISOString()],
          },
        ],
        service: [WSFE],
      },
    };
  }
}
