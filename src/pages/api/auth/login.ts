import type { APIRoute } from "astro";
import { createSession, verifyPassword } from "../../../lib/auth";
import { logger } from "../../../lib/logger";

export const POST: APIRoute = async ({ request }) => {
  logger.info("POST /api/auth/login called");
  try {
    const data = await request.json();
    logger.debug("Login request body", data);
    const { username, password } = data;

    if (!username || !password) {
      logger.warn("Login failed: missing username or password");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Username and password are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const isValid = await verifyPassword(username, password);

    if (!isValid) {
      logger.warn("Login failed: invalid credentials", { username });
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid username or password",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Create session and set cookie
    const sessionId = await createSession(username);
    logger.info("Login successful", { username, sessionId });
    // Set Secure flag only if HTTPS
    const isHttps =
      request.headers.get("x-forwarded-proto") === "https" ||
      request.url.startsWith("https://");
    const secureFlag = isHttps ? " Secure;" : "";
    return new Response(
      JSON.stringify({ success: true, message: "Login successful" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `panal_session=${sessionId}; HttpOnly; Path=/; SameSite=Strict;${secureFlag}`,
        },
      },
    );
  } catch (err) {
    logger.error("Failed to login", err);
    return new Response("Failed to login", { status: 500 });
  }
};
