import type { APIRoute } from "astro";
import { addLogListener, removeLogListener } from "../../../lib/log-stream";

export const GET: APIRoute = ({ params }) => {
  const { id } = params;
  if (!id || typeof id !== "string") {
    return new Response("Bad request", { status: 400 });
  }

  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
      addLogListener(id, send);
    },
    cancel() {
      removeLogListener(id, send);
    },
  });

  function send(msg: string) {
    controller.enqueue(encoder.encode(`data: ${msg}\n\n`));
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
