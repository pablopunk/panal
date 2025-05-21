// Authentication utilities

import crypto from "node:crypto";
import type { APIRoute } from "astro";
import { nanoid } from "nanoid";
import { type User, addUser, getUsers } from "./db";

// In-memory session store (for simplicity; can be persisted if needed)
const sessions = new Map<string, string>(); // sessionId -> username

export function hashPassword(password: string): string {
	return crypto.createHash("sha256").update(password).digest("hex");
}

export async function verifyPassword(
	username: string,
	password: string,
): Promise<boolean> {
	const users = await getUsers();
	const user = users.find((u: User) => u.username === username);
	if (!user) return false;
	return user.passwordHash === hashPassword(password);
}

export function createSession(username: string): string {
	const sessionId = nanoid(32);
	sessions.set(sessionId, username);
	return sessionId;
}

export function getSession(sessionId: string): string | undefined {
	return sessions.get(sessionId);
}

export function destroySession(sessionId: string) {
	sessions.delete(sessionId);
}

export function getSessionIdFromCookie(
	cookieHeader: string | undefined,
): string | undefined {
	if (!cookieHeader) return undefined;
	const match = cookieHeader.match(/panal_session=([^;]+)/);
	return match ? match[1] : undefined;
}

export async function isAuthenticated(
	cookieHeader: string | undefined,
): Promise<boolean> {
	const sessionId = getSessionIdFromCookie(cookieHeader);
	if (!sessionId) return false;
	const username = getSession(sessionId);
	if (!username) return false;
	const users = await getUsers();
	return users.some((u: User) => u.username === username);
}

// Middleware for API route protection
export function withAuth(apiHandler: APIRoute): APIRoute {
	return async (ctx) => {
		const cookie = ctx.request.headers.get("cookie") || undefined;
		if (!(await isAuthenticated(cookie))) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}
		return apiHandler(ctx);
	};
}
