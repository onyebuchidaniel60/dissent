import "server-only";

import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { workspaceMembers, workspaces } from "@/db/schema";

export async function getWorkspaceForAccount(accountId: string) {
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
    .where(
      and(
        eq(workspaceMembers.accountId, accountId),
        eq(workspaces.status, "ACTIVE"),
      ),
    )
    .limit(1);
  return row ?? null;
}
