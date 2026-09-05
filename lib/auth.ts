import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: "admin" | "engineer" | "viewer";
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, SECRET, { expiresIn: "8h" });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function requireRole(user: AuthUser | null, roles: AuthUser["role"][]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
