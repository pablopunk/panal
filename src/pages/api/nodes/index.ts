import type { APIRoute } from "astro";
import { getNodes } from "../../../lib/docker/nodes";

export const GET: APIRoute = async () => {
  try {
    const nodes = await getNodes();

    return new Response(JSON.stringify({ success: true, data: nodes }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: "Failed to fetch nodes" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
