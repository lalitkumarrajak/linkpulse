import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "lp_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  sub: string;
}

function secretKey(secret = process.env.AUTH_SECRET) {
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set (min. 32 characters)");
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(userId: string, secret?: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setIssuer("linkpulse")
    .sign(secretKey(secret));
}

export async function verifySessionToken(
  token: string | undefined,
  secret?: string,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(secret), {
      issuer: "linkpulse",
      algorithms: ["HS256"],
    });
    return payload.sub ? { sub: payload.sub } : null;
  } catch {
    return null;
  }
}
