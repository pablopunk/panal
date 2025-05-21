import type { MiddlewareHandler } from "astro";
import { isAuthenticated } from "./lib/auth";
import { getUsers } from "./lib/db";

export const onRequest: MiddlewareHandler = async (context, next) => {
	const { pathname } = new URL(context.request.url);

	// Allow public routes
	if (
		pathname.startsWith("/api/auth") ||
		pathname === "/login" ||
		pathname === "/setup" ||
		pathname.startsWith("/public") ||
		pathname.startsWith("/_astro")
	) {
		return next();
	}

	const users = await getUsers();
	const origin = context.url.origin;
	if (users.length === 0 && pathname !== "/setup") {
		return Response.redirect(`${origin}/setup`, 302);
	}

	const cookie = context.request.headers.get("cookie") || undefined;
	if (users.length > 0 && !(await isAuthenticated(cookie))) {
		return Response.redirect(`${origin}/login`, 302);
	}

	return next();
}; 