// Database utilities for storing configuration

import fs from "node:fs/promises";
import path from "node:path";

const DB_LOCATION = process.env.DB_LOCATION || path.join("./data", "db.json");

export interface AppSettings {
	hostname: string;
}

export interface User {
	username: string;
	password: string; // hashed
}

export interface DBData {
	users: User[];
	settings: AppSettings;
}

const defaultData: DBData = {
	users: [],
	settings: { hostname: "localhost" },
};

async function ensureDbFile() {
	try {
		await fs.access(DB_LOCATION);
	} catch {
		// Create directory if needed
		await fs.mkdir(path.dirname(DB_LOCATION), { recursive: true });
		await fs.writeFile(DB_LOCATION, JSON.stringify(defaultData, null, 2));
	}
}

export async function readDb(): Promise<DBData> {
	await ensureDbFile();
	const raw = await fs.readFile(DB_LOCATION, "utf-8");
	try {
		return JSON.parse(raw);
	} catch {
		return { ...defaultData };
	}
}

export async function writeDb(data: DBData): Promise<void> {
	await ensureDbFile();
	await fs.writeFile(DB_LOCATION, JSON.stringify(data, null, 2));
}

export async function getSettings(): Promise<AppSettings> {
	const db = await readDb();
	return db.settings;
}

export async function updateSettings(
	settings: Partial<AppSettings>,
): Promise<void> {
	const db = await readDb();
	db.settings = { ...db.settings, ...settings };
	await writeDb(db);
}
