import type { APIRoute } from "astro";
import { nanoid } from "nanoid";
import { createSession, hashPassword } from "../../../lib/auth";
import { addUser, getUsers } from "../../../lib/db";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Only allow setup if no users exist
    const users = await getUsers();
    if (users.length > 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Setup already completed" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const data = await request.json();
    const { username, password, swarmAction, joinToken } = data;

    if (!username || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Username and password are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Create the admin user
    const user = {
      id: nanoid(),
      username,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    await addUser(user);

    // Create session and set cookie
    const sessionId = createSession(username);

    // Handle swarm setup (still mock for now)
    let swarmMessage = "";
    switch (swarmAction) {
      case "init":
        swarmMessage = "Swarm initialized successfully";
        break;
      case "join":
        if (!joinToken) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Join token is required",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
        swarmMessage = "Joined swarm successfully";
        break;
      case "skip":
        swarmMessage = "Skipped swarm setup";
        break;
      default:
        swarmMessage = "Unknown swarm action";
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Setup completed successfully",
        swarmMessage,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `panal_session=${sessionId}; HttpOnly; Path=/; SameSite=Strict; Secure`,
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
