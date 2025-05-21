import type { APIRoute } from "astro";
import { getSettings, updateSettings } from "../../../lib/db";

export const GET: APIRoute = async () => {
	try {
		const settings = await getSettings();

		return new Response(JSON.stringify({ success: true, data: settings }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({ success: false, message: "Failed to fetch settings" }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};

export const POST: APIRoute = async ({ request }) => {
	try {
		const data = await request.json();
		await updateSettings(data);
		return new Response(
			JSON.stringify({
				success: true,
				message: "Settings updated successfully",
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		return new Response(
			JSON.stringify({ success: false, message: "Failed to update settings" }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
