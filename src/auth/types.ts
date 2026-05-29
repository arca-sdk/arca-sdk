export interface ArcaAuthTicket {
  token: string;
  sign: string;
  expirationTime?: Date | string;
}

export type ArcaAuthProvider = () => ArcaAuthTicket | Promise<ArcaAuthTicket>;

export type ArcaAuthInput = ArcaAuthTicket | ArcaAuthProvider;

export interface ArcaResolvedAuthTicket {
  token: string;
  sign: string;
  expirationTime?: Date;
}
