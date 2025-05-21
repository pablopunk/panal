import type { APIRoute } from "astro"
import { getStacks } from "../../../lib/docker/stacks"

export const GET: APIRoute = async () => {
  try {
    const stacks = await getStacks()

    return new Response(JSON.stringify({ success: true, data: stacks }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: "Failed to fetch stacks" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
