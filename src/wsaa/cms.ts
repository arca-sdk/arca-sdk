import forge from "node-forge";
import { ArcaAuthError } from "../errors";
import type { WsaaPemInput } from "./types";

export interface SignCmsOptions {
  certificate: WsaaPemInput;
  privateKey: WsaaPemInput;
  privateKeyPassphrase?: string;
}

export function signCms(content: string, options: SignCmsOptions): string {
  const certificatePem = normalizePemInput(options.certificate, "certificate");
  const privateKeyPem = normalizePemInput(options.privateKey, "privateKey");
  const certificate = parseCertificate(certificatePem);
  const privateKey = parsePrivateKey(privateKeyPem, options.privateKeyPassphrase);
  const contentTypeOid = requiredOid(forge.pki.oids.contentType, "contentType");
  const dataOid = requiredOid(forge.pki.oids.data, "data");
  const messageDigestOid = requiredOid(forge.pki.oids.messageDigest, "messageDigest");
  const signingTimeOid = requiredOid(forge.pki.oids.signingTime, "signingTime");
  const sha256Oid = requiredOid(forge.pki.oids.sha256, "sha256");
  const signedData = forge.pkcs7.createSignedData();

  signedData.content = forge.util.createBuffer(content, "utf8");
  signedData.addCertificate(certificate);
  signedData.addSigner({
    authenticatedAttributes: [
      {
        type: contentTypeOid,
        value: dataOid,
      },
      {
        type: messageDigestOid,
      },
      {
        type: signingTimeOid,
        value: new Date() as unknown as string,
      },
    ],
    certificate,
    digestAlgorithm: sha256Oid,
    key: privateKey,
  });

  try {
    signedData.sign();
    const derBytes = forge.asn1.toDer(signedData.toAsn1()).getBytes();

    return Buffer.from(derBytes, "binary").toString("base64");
  } catch (cause) {
    throw new ArcaAuthError("Unable to sign WSAA login ticket request.", { cause });
  }
}

function normalizePemInput(input: WsaaPemInput, label: string): string {
  const value = Buffer.isBuffer(input) ? input.toString("utf8") : input;

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ArcaAuthError(`WSAA ${label} must be a non-empty PEM string or Buffer.`);
  }

  return value;
}

function parseCertificate(certificatePem: string): forge.pki.Certificate {
  try {
    return forge.pki.certificateFromPem(certificatePem);
  } catch (cause) {
    throw new ArcaAuthError("Invalid WSAA certificate PEM.", { cause });
  }
}

function parsePrivateKey(privateKeyPem: string, passphrase?: string): forge.pki.rsa.PrivateKey {
  if (passphrase !== undefined) {
    const decryptedPrivateKey = forge.pki.decryptRsaPrivateKey(privateKeyPem, passphrase);

    if (!decryptedPrivateKey) {
      throw new ArcaAuthError("Invalid WSAA private key PEM or passphrase.");
    }

    return decryptedPrivateKey;
  }

  try {
    return forge.pki.privateKeyFromPem(privateKeyPem) as forge.pki.rsa.PrivateKey;
  } catch (cause) {
    throw new ArcaAuthError("Invalid WSAA private key PEM.", { cause });
  }
}

function requiredOid(value: string | undefined, name: string): string {
  if (!value) {
    throw new ArcaAuthError(`node-forge is missing required OID ${name}.`);
  }

  return value;
}
