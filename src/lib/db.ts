// Database utilities for storing configuration

import fs from "node:fs/promises";
import path from "node:path";

const DB_LOCATION = process.env.DB_LOCATION || "./data";
const DB_FILE = path.join(DB_LOCATION, "db.json");

export interface User {
	id: string;
	username: string;
	passwordHash: string;
	createdAt: string;
}

export interface Settings {
	[key: string]: unknown;
}

export interface DbData {
	users: User[];
	settings: Settings;
}

async function ensureDbFile() {
	try {
		await fs.mkdir(DB_LOCATION, { recursive: true });
		await fs.access(DB_FILE);
	} catch {
		const initial: DbData = { users: [], settings: {} };
		await fs.writeFile(DB_FILE, JSON.stringify(initial, null, 2));
	}
}

export async function getDb(): Promise<DbData> {
	await ensureDbFile();
	const raw = await fs.readFile(DB_FILE, "utf-8");
	return JSON.parse(raw);
}

export async function saveDb(data: DbData) {
	await ensureDbFile();
	await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

export async function getUsers(): Promise<User[]> {
	const db = await getDb();
	return db.users;
}

export async function addUser(user: User) {
	const db = await getDb();
	db.users.push(user);
	await saveDb(db);
}

export async function getSettings(): Promise<Settings> {
	const db = await getDb();
	return db.settings;
}

export async function updateSettings(settings: Settings) {
	const db = await getDb();
	db.settings = { ...db.settings, ...settings };
	await saveDb(db);
}
