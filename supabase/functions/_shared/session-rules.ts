type ClaimsResult = {
  data: { claims?: Record<string, unknown> } | null;
  error: unknown;
};

// The verifier must cryptographically validate the token; never decode it locally.
export async function validatedSessionUserId(
  authorization: string | null,
  verify: (token: string) => Promise<ClaimsResult>,
): Promise<string | null> {
  const token = /^Bearer ([^\s,]+)$/i.exec(authorization ?? "")?.[1];
  if (!token) return null;
  try {
    const { data, error } = await verify(token);
    const claims = data?.claims;
    if (error || claims?.role !== "authenticated" || typeof claims.sub !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(claims.sub)) return null;
    return claims.sub;
  } catch { return null; }
}