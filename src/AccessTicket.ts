export class AccessTicket implements IAccessTicket {
  readonly header: ILoginCmsReturnHeaders;
  readonly credentials: ILoginCmsReturnCredentials;

  constructor({ header, credentials }: ILoginCredentials) {
    this.header = header;
    this.credentials = credentials;
  }

  getSign(): string {
    return this.credentials.sign;
  }

  getToken(): string {
    return this.credentials.token;
  }

  getExpiration(): Date {
    return new Date(this.header[1].expirationtime);
  }

  getHeaders(): ILoginCmsReturnHeaders {
    return this.header;
  }

  getCredentials(): ILoginCmsReturnCredentials {
    return this.credentials;
  }

  getWSAuthFormat(cuit: number) {
    return {
      Auth: {
        Token: this.getToken(),
        Sign: this.getSign(),
        Cuit: cuit,
      },
    };
  }

  public isExpired(): boolean {
    return hasExpired(this.getExpiration());
  }
}

export interface IAccessTicket extends ILoginCredentials {
  getSign(): string;
  getToken(): string;
  getExpiration(): Date;
  getWSAuthFormat(cuit: number): {
    Auth: {
      Token: string;
      Sign: string;
      Cuit: number;
    };
  };
  isExpired(): boolean;
}

export interface ILoginCmsReturn {
  header: ILoginCmsReturnHeaders;
  credentials: ILoginCmsReturnCredentials;
}

export interface ILoginCredentials extends ILoginCmsReturn {}

export interface ILoginCmsReturnHeaders {
  [0]: ILoginCmsReturnHeaderVersion;
  [1]: ILoginCmsReturnHeaderData;
}
export interface ILoginCmsReturnCredentials {
  token: string;
  sign: string;
}
export interface ILoginCmsReturnHeaderVersion {
  version: string;
}

export interface ILoginCmsReturnHeaderData {
  source: string;
  destination: string;
  uniqueid: string;
  generationtime: string;
  expirationtime: string;
}

function hasExpired(expirationDate: Date) {
  const now = new Date();
  return expirationDate < now;
}
