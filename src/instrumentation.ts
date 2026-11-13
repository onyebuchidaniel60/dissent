export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { startQueue } = await import("./lib/queue");
    await startQueue();
  } catch (error) {
    console.error("[instrumentation] queue bootstrap failed", {
      name: error instanceof Error ? error.name : "unknown",
    });
  }
}
