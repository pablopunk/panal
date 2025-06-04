import type { APIRoute } from "astro";
import { getNodeById } from "../../../lib/docker/nodes";

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, message: "Node ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const node = await getNodeById(id);

    if (!node) {
      return new Response(
        JSON.stringify({ success: false, message: "Node not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ success: true, data: node }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: "Failed to fetch node" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
