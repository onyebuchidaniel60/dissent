import { createHmac, randomBytes } from "node:crypto";
import { Pool } from "pg";

const API_KEY_PREFIX = "ds_test_";
const CLIENT_SCOPES = [
  "audit:create",
  "audit:read:own",
  "audit:commit",
  "audit:fund",
  "certificate:read:own",
];
const CLIENT_ACCOUNT_ID = process.env.DEMO_CLIENT_ACCOUNT_ID ?? "demo-client.testnet";

function hashKey(key: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required");
  return createHmac("sha256", secret).update(key).digest("hex");
}

async function main() {
  const connectionString = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL_DIRECT or DATABASE_URL is required");

  const workspaceName = process.env.DEMO_WORKSPACE_NAME ?? "Demo Client";
  const keyName = process.env.DEMO_KEY_NAME ?? "demo-agent";
  const pool = new Pool({ connectionString, max: 2 });

  try {
    const existing = await pool.query<{ id: string }>(
      "select id from workspaces where name = $1 limit 1",
      [workspaceName],
    );

    let workspaceId = existing.rows[0]?.id;
    if (!workspaceId) {
      const inserted = await pool.query<{ id: string }>(
        "insert into workspaces (name, client_account_id, status) values ($1, $2, 'ACTIVE') returning id",
        [workspaceName, CLIENT_ACCOUNT_ID],
      );
      workspaceId = inserted.rows[0]?.id;
    } else {
      await pool.query("update workspaces set client_account_id = coalesce(client_account_id, $2) where id = $1", [
        workspaceId,
        CLIENT_ACCOUNT_ID,
      ]);
    }
    if (!workspaceId) throw new Error("Could not create workspace");

    const key = `${API_KEY_PREFIX}${randomBytes(32).toString("base64url")}`;
    const prefix = key.slice(0, 16);

    await pool.query(
      `insert into client_api_keys
        (workspace_id, name, key_prefix, key_hash, scopes, status)
       values ($1, $2, $3, $4, $5, 'ACTIVE')`,
      [workspaceId, keyName, prefix, hashKey(key), CLIENT_SCOPES],
    );

    console.log("Client key provisioned. The plaintext key is shown once:");
    console.log(`workspace_id: ${workspaceId}`);
    console.log(`workspace: ${workspaceName}`);
    console.log(`key_name: ${keyName}`);
    console.log(`key_prefix: ${prefix}`);
    console.log(`api_key: ${key}`);
    console.log("Store the key in the operator secret store. It cannot be recovered later.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Provisioning failed");
  process.exitCode = 1;
});
