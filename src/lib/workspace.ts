import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { workspaceMembers, workspaces } from "@/db/schema";

export type WorkspaceAccess = {
  workspaceId: string;
  workspaceName: string;
  clientAccountId: string | null;
  role: string;
  status: string;
};

async function findWorkspaceForAccount(accountId: string): Promise<WorkspaceAccess | null> {
  const [row] = await getDb()
    .select({
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      clientAccountId: workspaces.clientAccountId,
      role: workspaceMembers.role,
      status: workspaces.status,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(and(eq(workspaceMembers.accountId, accountId), eq(workspaces.status, "ACTIVE")))
    .limit(1);
  return row ?? null;
}

export async function getWorkspaceForAccount(accountId: string): Promise<WorkspaceAccess | null> {
  return findWorkspaceForAccount(accountId);
}

/**
 * Every authenticated wallet gets a personal workspace on first use. This keeps
 * the client audit flow usable for a new judge without an operator-created row.
 * The advisory lock makes concurrent first requests converge on one workspace.
 */
export async function ensureWorkspaceForAccount(accountId: string): Promise<WorkspaceAccess> {
  const existing = await findWorkspaceForAccount(accountId);
  if (existing) return existing;

  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`workspace:${accountId}`}))`);

    const [member] = await tx
      .select({
        workspaceId: workspaces.id,
        workspaceName: workspaces.name,
        clientAccountId: workspaces.clientAccountId,
        role: workspaceMembers.role,
        status: workspaces.status,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(and(eq(workspaceMembers.accountId, accountId), eq(workspaces.status, "ACTIVE")))
      .limit(1);
    if (member) return member;

    const [ownedWorkspace] = await tx
      .select({
        workspaceId: workspaces.id,
        workspaceName: workspaces.name,
        clientAccountId: workspaces.clientAccountId,
        status: workspaces.status,
      })
      .from(workspaces)
      .where(and(eq(workspaces.clientAccountId, accountId), eq(workspaces.status, "ACTIVE")))
      .limit(1);

    if (ownedWorkspace) {
      await tx
        .insert(workspaceMembers)
        .values({ workspaceId: ownedWorkspace.workspaceId, accountId, role: "OWNER" })
        .onConflictDoNothing();
      return { ...ownedWorkspace, role: "OWNER" };
    }

    const [created] = await tx
      .insert(workspaces)
      .values({
        name: "Personal workspace",
        clientAccountId: accountId,
        status: "ACTIVE",
      })
      .returning({
        workspaceId: workspaces.id,
        workspaceName: workspaces.name,
        clientAccountId: workspaces.clientAccountId,
        status: workspaces.status,
      });

    if (!created) throw new Error("WORKSPACE_CREATE_FAILED");

    await tx
      .insert(workspaceMembers)
      .values({ workspaceId: created.workspaceId, accountId, role: "OWNER" });

    return { ...created, role: "OWNER" };
  });
}
