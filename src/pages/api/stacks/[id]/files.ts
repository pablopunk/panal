import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import type { APIRoute } from "astro";
import { STACKS_DIR } from "../../../../lib/config";
import { runStackDeployOrUpdate } from "../../../../lib/docker/services";
import { logger } from "../../../../lib/logger";

const STACKS_LOCATION = STACKS_DIR;

export const GET: APIRoute = async ({ params }) => {
  logger.info("GET /api/stacks/[id]/files called", params.id);
  const { id } = params;
  if (!id || typeof id !== "string") {
    return new Response(
      JSON.stringify({ success: false, message: "Missing stack id" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const stackDir = path.join(STACKS_LOCATION, id);
  try {
    const composePath = path.join(stackDir, "docker-compose.yml");
    const envPath = path.join(stackDir, ".env");
    const [compose, env] = await Promise.all([
      fs.readFile(composePath, "utf-8"),
      fs.readFile(envPath, "utf-8").catch(() => ""),
    ]);
    return new Response(
      JSON.stringify({ success: true, data: { compose, env } }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    logger.error("Failed to get stack files", err);
    return new Response(
      JSON.stringify({ success: false, message: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  logger.info("PUT /api/stacks/[id]/files called", params.id);
  const { id } = params;
  if (!id || typeof id !== "string") {
    return new Response(
      JSON.stringify({ success: false, message: "Missing stack id" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const { compose, env } = await request.json();
  const result = await runStackDeployOrUpdate({ id, compose, env });
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
};
