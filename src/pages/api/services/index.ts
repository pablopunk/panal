import type { APIRoute } from "astro";
import {
  type Service,
  getServices,
  getServicesByStackId,
} from "../../../lib/docker/services";

export const GET: APIRoute = async ({ url }) => {
  try {
    const stackId = url.searchParams.get("stackId");
    let services: Service[];

    if (stackId) {
      services = await getServicesByStackId(stackId);
    } else {
      services = await getServices();
    }

    return new Response(JSON.stringify({ success: true, data: services }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: "Failed to fetch services" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
