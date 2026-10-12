export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertRuntimePermissions } = await import("@/lib/db/permissions");
    await assertRuntimePermissions();
  }
}
