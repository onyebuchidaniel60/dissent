import { createHash } from "node:crypto";

import { KeyPair } from "near-api-js";
import { serialize } from "borsh";

const NEP413_PREFIX = 2147484061;
const NEP413_SCHEMA = {
  struct: {
    message: "string",
    nonce: { array: { type: "u8", len: 32 } },
    recipient: "string",
    callbackUrl: { option: "string" },
  },
};

export async function getSessionCookie(baseURL: string): Promise<string | null> {
  const accountId = process.env.NEAR_DEPLOYER_ACCOUNT_ID;
  const privateKey = process.env.NEAR_DEPLOYER_KEY;
  if (!accountId || !privateKey) return null;

  const nonceResponse = await fetch(`${baseURL}/api/v1/auth/nonce`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ accountId }),
  });
  if (!nonceResponse.ok) return null;
  const challenge = (await nonceResponse.json()) as {
    nonce: string;
    message: string;
    recipient: string;
    callbackUrl: string;
  };

  const nonce = Buffer.from(challenge.nonce, "base64");
  const prefix = Buffer.alloc(4);
  prefix.writeUInt32LE(NEP413_PREFIX, 0);
  const params = serialize(NEP413_SCHEMA, {
    message: challenge.message,
    nonce,
    recipient: challenge.recipient,
    callbackUrl: challenge.callbackUrl,
  });
  const digest = createHash("sha256")
    .update(Buffer.concat([prefix, Buffer.from(params)]))
    .digest();
  const keyPair = KeyPair.fromString(privateKey as `ed25519:${string}`);
  const signature = keyPair.sign(digest);

  const verifyResponse = await fetch(`${baseURL}/api/v1/auth/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      accountId,
      publicKey: keyPair.getPublicKey().toString(),
      signature: Buffer.from(signature.signature).toString("base64"),
      nonce: challenge.nonce,
    }),
  });
  if (!verifyResponse.ok) return null;

  const setCookie = verifyResponse.headers.get("set-cookie");
  if (!setCookie) return null;
  return setCookie.split(";")[0].split("=")[1] ?? null;
}
