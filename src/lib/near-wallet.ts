import type { Action, Wallet, WalletSelector } from "@near-wallet-selector/core";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";

import { DEFAULT_WALLET_NETWORK } from "@/lib/config";

type SelectorBundle = {
  selector: WalletSelector;
  modal: WalletSelectorModal;
};

let selectorPromise: Promise<SelectorBundle> | null = null;

export function getNearWalletSelector(): Promise<SelectorBundle> {
  if (!selectorPromise) {
    selectorPromise = (async () => {
      const { setupWalletSelector } = await import("@near-wallet-selector/core");
      const { setupModal } = await import("@near-wallet-selector/modal-ui");
      const { setupMyNearWallet } = await import("@near-wallet-selector/my-near-wallet");
      const { setupNightly } = await import("@near-wallet-selector/nightly");

      const network = (process.env.NEXT_PUBLIC_NEAR_NETWORK ??
        DEFAULT_WALLET_NETWORK) as "mainnet" | "testnet";

      const selector = await setupWalletSelector({
        network,
        modules: [setupMyNearWallet(), setupNightly()],
      });
      const modal = setupModal(selector, {
        description: "Connect a NEAR wallet to sign the Dissent session challenge.",
      });
      return { selector, modal };
    })();
  }
  return selectorPromise;
}

function waitForWalletAccount(selector: WalletSelector): Promise<string> {
  const accounts = selector.store.getState().accounts;
  if (accounts.length > 0) return Promise.resolve(accounts[0]!.accountId);

  return new Promise((resolve, reject) => {
    let subscription: { remove: () => void } | null = null;
    const timeout = window.setTimeout(() => {
      subscription?.remove();
      reject(new Error("Wallet connection timed out. Reconnect and try again."));
    }, 120_000);

    subscription = selector.on("signedIn", (event) => {
      window.clearTimeout(timeout);
      subscription?.remove();
      const account = event.accounts[0];
      if (!account) {
        reject(new Error("The wallet did not return an account."));
        return;
      }
      resolve(account.accountId);
    });
  });
}

/**
 * Returns the connected wallet for transaction signing. If the selector has no
 * account yet, it opens the shared wallet modal and waits for the connection.
 */
export async function getConnectedWallet(): Promise<{ wallet: Wallet; accountId: string }> {
  const { selector, modal } = await getNearWalletSelector();
  if (selector.store.getState().accounts.length === 0) modal.show();
  const accountId = await waitForWalletAccount(selector);
  const wallet = await selector.wallet();
  return { wallet, accountId };
}

export function functionCallAction(input: {
  methodName: string;
  args: Record<string, unknown>;
  gas: string;
  deposit: string;
}): Action {
  return {
    functionCall: {
      methodName: input.methodName,
      args: new TextEncoder().encode(JSON.stringify(input.args)),
      gas: BigInt(input.gas),
      deposit: BigInt(input.deposit),
    },
  } as unknown as Action;
}

export function transactionHashFromOutcome(outcome: unknown): string | null {
  if (!outcome || typeof outcome !== "object") return null;
  const result = outcome as {
    transaction?: { hash?: string };
    transaction_outcome?: { id?: string };
  };
  return result.transaction?.hash ?? result.transaction_outcome?.id ?? null;
}
