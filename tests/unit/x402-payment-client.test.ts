import { createHash } from "node:crypto";

import {
  KeyPair,
  actions,
  buildDelegateAction,
  decodeSignedDelegate,
  encodeDelegateAction,
  encodeSignedDelegate,
  SignedDelegate,
  Signature,
} from "near-api-js";
import {
  decodePaymentSignatureHeader,
  encodePaymentRequiredHeader,
  encodePaymentResponseHeader,
} from "@x402/core/http";
import type { PaymentRequired } from "@x402/core/types";
import { describe, expect, it, vi } from "vitest";

import {
  formatUsdcAtomic,
  payAndRequest,
  X402PaymentError,
} from "../../packages/execution/x402-payment-client";

const NETWORK = "near:testnet";
const ASSET = "usdc.tidepool-sandbox.testnet";
const PAYEE = "dissent-demo.testnet";
const PAYER = "x402-agent.testnet";
const AMOUNT = "2000";
const URL = "https://dissent-web.onrender.com/api/x402/openrouter/chat/completions";

function signedDelegateFor(amount: string): string {
  const keyPair = KeyPair.fromRandom("ed25519");
  const delegateAction = buildDelegateAction({
    senderId: PAYER,
    receiverId: ASSET,
    publicKey: keyPair.getPublicKey(),
    nonce: 15_000_000_000_000_000n,
    maxBlockHeight: 999_999_999n,
    actions: [
      actions.functionCall("ft_transfer", { receiver_id: PAYEE, amount }, 30_000_000_000_000n, 1n),
    ],
  });
  const hash = createHash("sha256").update(encodeDelegateAction(delegateAction)).digest();
  const rawSignature = keyPair.sign(hash);
  const signature = new Signature({ keyType: 0, data: rawSignature.signature });
  return Buffer.from(
    encodeSignedDelegate(new SignedDelegate({ delegateAction, signature })),
  ).toString("base64");
}

const challenge: PaymentRequired = {
  x402Version: 2,
  resource: {
    url: URL,
    description: "Dissent OpenRouter inference via x402",
    mimeType: "application/json",
  },
  accepts: [
    {
      scheme: "exact",
      network: NETWORK,
      asset: ASSET,
      amount: AMOUNT,
      payTo: PAYEE,
      maxTimeoutSeconds: 60,
      extra: {},
    },
  ],
};

describe("x402 payment client", () => {
  it("signs a NEP-366 ft_transfer delegate for the 402 challenge and logs the settled payment", async () => {
    const delegate = signedDelegateFor(AMOUNT);
    const signer = {
      createSignedDelegateAction: vi.fn(async () => delegate),
    };

    let calls = 0;
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls += 1;
      if (calls === 1) {
        return new Response(null, {
          status: 402,
          headers: { "payment-required": encodePaymentRequiredHeader(challenge) },
        });
      }

      const header = new Headers(init?.headers).get("PAYMENT-SIGNATURE");
      expect(header).toBeTruthy();
      const payload = decodePaymentSignatureHeader(header!);
      expect(payload.x402Version).toBe(2);
      expect(payload.accepted).toMatchObject({
        scheme: "exact",
        network: NETWORK,
        asset: ASSET,
        amount: AMOUNT,
        payTo: PAYEE,
      });

      const payloadValue = payload.payload as { signedDelegateAction?: string };
      expect(typeof payloadValue.signedDelegateAction).toBe("string");
      const decoded = decodeSignedDelegate(
        Buffer.from(payloadValue.signedDelegateAction!, "base64"),
      );
      const delegate = decoded.delegateAction;
      expect(delegate.senderId).toBe(PAYER);
      expect(delegate.receiverId).toBe(ASSET);
      expect(delegate.actions).toHaveLength(1);
      const functionCall = delegate.actions[0] as {
        functionCall?: { methodName: string; deposit: bigint; args: Uint8Array };
      };
      expect(functionCall.functionCall?.methodName).toBe("ft_transfer");
      expect(functionCall.functionCall?.deposit).toBe(1n);
      const args = JSON.parse(Buffer.from(functionCall.functionCall!.args).toString("utf8")) as {
        receiver_id: string;
        amount: string;
      };
      expect(args).toEqual({ receiver_id: PAYEE, amount: AMOUNT });

      return new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "payment-response": encodePaymentResponseHeader({
            success: true,
            transaction: "DtxHash111",
            network: NETWORK,
            payer: PAYER,
          }),
        },
      });
    });

    const logs: string[] = [];
    const result = await payAndRequest(
      URL,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: "z-ai/glm-5.3-flash", messages: [] }),
      },
      {
        provider: "openrouter",
        network: NETWORK,
        signer,
        fetch: fetchMock as typeof fetch,
        requirePayment: true,
        log: (line) => logs.push(line),
      },
    );

    expect(calls).toBe(2);
    expect(result.payment).toEqual({
      provider: "openrouter",
      network: NETWORK,
      asset: ASSET,
      payTo: PAYEE,
      amountAtomic: AMOUNT,
      amountUsdc: "0.002",
      payer: PAYER,
      transaction: "DtxHash111",
    });
    expect(logs).toEqual([
      "[x402] Paid 0.002 USDC to dissent-demo.testnet for openrouter inference.",
    ]);
    expect(signer.createSignedDelegateAction).toHaveBeenCalledTimes(1);
  });

  it("refuses a paid resource that answers without a challenge", async () => {
    const signer = { createSignedDelegateAction: vi.fn() };
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));

    await expect(
      payAndRequest(
        URL,
        { method: "POST", body: "{}" },
        {
          provider: "groq",
          network: NETWORK,
          signer,
          fetch: fetchMock as typeof fetch,
          requirePayment: true,
        },
      ),
    ).rejects.toMatchObject({ code: "NOT_ENFORCED" } satisfies Partial<X402PaymentError>);
    expect(signer.createSignedDelegateAction).not.toHaveBeenCalled();
  });

  it("formats token amounts without floating point", () => {
    expect(formatUsdcAtomic("2000")).toBe("0.002");
    expect(formatUsdcAtomic("10000000")).toBe("10");
    expect(formatUsdcAtomic("1234567")).toBe("1.234567");
  });
});
