import type { APIRoute } from "astro";
import { createUser, isSetupComplete } from "../../../lib/auth";

export const POST: APIRoute = async ({ request }) => {
	try {
		// Check if setup is already complete
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
		const userCreated = await createUser(username, password);

		if (!userCreated) {
			return new Response(
				JSON.stringify({ success: false, message: "Failed to create user" }),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

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
			{ status: 200, headers: { "Content-Type": "application/json" } },
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
