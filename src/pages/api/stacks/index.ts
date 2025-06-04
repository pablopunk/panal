import type { APIRoute } from "astro";
import { getStacks } from "../../../lib/docker/stacks";
import { logger } from "../../../lib/logger";

export const GET: APIRoute = async () => {
  logger.info("GET /api/stacks called");
  try {
    const stacks = await getStacks();

    return new Response(JSON.stringify({ success: true, data: stacks }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("Failed to get stacks", error);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to fetch stacks" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
