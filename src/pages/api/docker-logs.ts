import Docker from "dockerode";
import type { APIRoute } from "astro";
import { logger } from "../../lib/logger";

const docker = new Docker();

async function getDockerLogs({ lines = 200 }: { lines?: number }) {
  const containers = await docker.listContainers({ all: true });
  let output = "";
  for (const c of containers) {
    const name = c.Names?.[0] || c.Id;
    try {
      const container = docker.getContainer(c.Id);
      const stream = await container.logs({
        stdout: true,
        stderr: true,
        tail: lines,
        timestamps: true,
      });
      output += `# ${name}\n` + stream.toString();
    } catch (err) {
      logger.error("Failed to get container logs", { id: c.Id, err });
    }
  }
  return output;
}

export const GET: APIRoute = async ({ request }) => {
  logger.info("GET /api/docker-logs called");
  const url = new URL(request.url);
  const lines = Number(url.searchParams.get("lines")) || 200;
  try {
    const logs = await getDockerLogs({ lines });
    return new Response(logs, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err) {
    logger.error("Failed to get docker logs", err);
    return new Response("Failed to get logs", { status: 500 });
  }
};
