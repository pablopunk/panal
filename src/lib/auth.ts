// Authentication utilities

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { APIRoute } from "astro";
import { nanoid } from "nanoid";
import { DB_LOCATION } from "./config";
import { type User, addUser, getUsers } from "./db";

const SESSIONS_FILE = path.join(DB_LOCATION, "sessions.json");

// Helper to load sessions from file
async function loadSessions(): Promise<Record<string, string>> {
	try {
		const data = await fs.readFile(SESSIONS_FILE, "utf-8");
		return JSON.parse(data);
	} catch {
		return {};
	}
}

// Helper to save sessions to file
async function saveSessions(sessions: Record<string, string>) {
	await fs.mkdir(DB_LOCATION, { recursive: true });
	await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions), "utf-8");
}

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

export async function createSession(username: string): Promise<string> {
	const sessionId = nanoid(32);
	const sessions = await loadSessions();
	sessions[sessionId] = username;
	await saveSessions(sessions);
	return sessionId;
}

export async function getSession(
	sessionId: string,
): Promise<string | undefined> {
	const sessions = await loadSessions();
	return sessions[sessionId];
}

export async function destroySession(sessionId: string) {
	const sessions = await loadSessions();
	delete sessions[sessionId];
	await saveSessions(sessions);
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
	const username = await getSession(sessionId);
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
