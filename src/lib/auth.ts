// Authentication utilities

import crypto from "node:crypto";
import { type User, readDb, writeDb } from "./db";

function hashPassword(password: string): string {
	return crypto.createHash("sha256").update(password).digest("hex");
}

// Mock user database
const users: User[] = [];

export async function isSetupComplete(): Promise<boolean> {
	const db = await readDb();
	return db.users.length > 0;
}

export async function createUser(
	username: string,
	password: string,
): Promise<boolean> {
	const db = await readDb();
	if (db.users.some((user) => user.username === username)) {
		return false;
	}
	db.users.push({ username, password: hashPassword(password) });
	await writeDb(db);
	return true;
}

export async function validateUser(
	username: string,
	password: string,
): Promise<boolean> {
	const db = await readDb();
	const hashed = hashPassword(password);
	return db.users.some(
		(user) => user.username === username && user.password === hashed,
	);
}

export async function updateUserPassword(
	username: string,
	currentPassword: string,
	newPassword: string,
): Promise<boolean> {
	const db = await readDb();
	const hashedCurrent = hashPassword(currentPassword);
	const userIndex = db.users.findIndex(
		(user) => user.username === username && user.password === hashedCurrent,
	);
	if (userIndex === -1) {
		return false;
	}
	db.users[userIndex].password = hashPassword(newPassword);
	await writeDb(db);
	return true;
}
