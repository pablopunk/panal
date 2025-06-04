import type { APIRoute } from "astro";
import { STACKS_DIR } from "../../../lib/config";
import { runStackDeployOrUpdate } from "../../../lib/docker/services";
import { logger } from "../../../lib/logger";

function isValidStackName(name: string) {
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

export const POST: APIRoute = async ({ request }) => {
  logger.info("POST /api/stacks/create called");
  try {
    const { name, compose, env } = await request.json();
    if (!name || !compose) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Name and compose.yml are required.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    if (!isValidStackName(name)) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Invalid stack name. Use only letters, numbers, dashes, and underscores.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    // Check if stack already exists
    const result = await runStackDeployOrUpdate({
      id: name,
      name,
      compose,
      env,
    });
    if (result.success) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({ success: false, message: result.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    logger.error("Failed to create stack", err);
    return new Response("Failed to create stack", { status: 500 });
  }
};
