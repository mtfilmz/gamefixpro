export function canDeleteRepair(userId: string, ownerId: string | null, isAdmin: boolean) {
  return isAdmin || ownerId === userId;
}
export async function passwordMatches(input: string, expected: string | undefined) {
  if (!expected) return false;
  const digest = async (value: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  const [a, b] = await Promise.all([digest(input), digest(expected)]);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}