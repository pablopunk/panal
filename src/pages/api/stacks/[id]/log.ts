import fs from "node:fs/promises";
import path from "node:path";
import type { APIRoute } from "astro";
import { STACKS_DIR } from "../../../../lib/config";
import { logger } from "../../../../lib/logger";

const STACKS_LOCATION = STACKS_DIR;

export const GET: APIRoute = async ({ params, request }) => {
  logger.info("GET /api/stacks/[id]/log called", params.id);
  const { id } = params;
  if (!id || typeof id !== "string") {
    return new Response(
      JSON.stringify({ success: false, log: "", message: "Missing stack id" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  const logPath = path.join(STACKS_LOCATION, id, "deploy.log");
  const url = new URL(request.url);
  const sinceParam = url.searchParams.get("since");
  const stream = url.searchParams.get("stream") === "1";
  let since = 0;
  if (sinceParam && !Number.isNaN(Number(sinceParam))) {
    since = Number(sinceParam);
  }
  if (stream) {
    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    const body = new ReadableStream({
      async start(controller) {
        let offset = since;
        const send = async () => {
          try {
            const stat = await fs.stat(logPath);
            if (stat.size > offset) {
              const fh = await fs.open(logPath, "r");
              const len = stat.size - offset;
              const buff = Buffer.alloc(len);
              await fh.read(buff, 0, len, offset);
              await fh.close();
              controller.enqueue(`data: ${buff.toString()}\n\n`);
              offset = stat.size;
            }
          } catch (err) {
            controller.error(err);
          }
        };
        await send();
        const watcher = fs.watch(logPath, async () => {
          await send();
        });
        (this as any).watcher = watcher;
      },
      cancel() {
        (this as any).watcher?.close();
      },
    });
    return new Response(body, { headers });
  }
  try {
    const stat = await fs.stat(logPath);
    const fileSize = stat.size;
    if (since >= fileSize) {
      // No new data
      return new Response(
        JSON.stringify({ success: true, log: "", offset: fileSize }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const fileHandle = await fs.open(logPath, "r");
    const length = fileSize - since;
    const buffer = Buffer.alloc(length);
    await fileHandle.read(buffer, 0, length, since);
    await fileHandle.close();
    return new Response(
      JSON.stringify({
        success: true,
        log: buffer.toString(),
        offset: fileSize,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    logger.error("Failed to get stack log", err);
    return new Response("Failed to get stack log", { status: 500 });
  }
};
