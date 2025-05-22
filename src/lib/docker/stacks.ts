import fs from "node:fs/promises";
import path from "node:path";
import Docker from "dockerode";
import { STACKS_DIR } from "../config";

const docker = new Docker();
const STACKS_LOCATION = STACKS_DIR;

export interface Stack {
	id: string;
	name: string;
	status: "running" | "partial" | "stopped";
	services: number;
	type: "swarm" | "standalone";
	managedBy: "panal" | "external";
}

// Helper: get all Panal-managed stack names from STACKS_LOCATION
async function getPanalManagedStacks(): Promise<string[]> {
	try {
		await fs.mkdir(STACKS_LOCATION, { recursive: true });
		const files = await fs.readdir(STACKS_LOCATION);
		const managed: string[] = [];
		for (const dir of files) {
			const stackPath = path.join(STACKS_LOCATION, dir);
			const stat = await fs.stat(stackPath);
			if (stat.isDirectory()) {
				const composePath = path.join(stackPath, "docker-compose.yml");
				try {
					await fs.access(composePath);
					managed.push(dir);
				} catch {}
			}
		}
		return managed;
	} catch {
		return [];
	}
}

// Standalone: get stacks from containers and STACKS_LOCATION
async function getUserDefinedStacksStandalone(): Promise<Stack[]> {
	const managed = await getPanalManagedStacks();
	const containers = await docker.listContainers({ all: true });
	// Group containers by COMPOSE_PROJECT_NAME label
	const projectMap: Record<string, number> = {};
	for (const c of containers) {
		const project = c.Labels["com.docker.compose.project"];
		if (project) {
			projectMap[project] = (projectMap[project] || 0) + 1;
		}
	}
	const stacks: Stack[] = [];
	// Panal-managed
	for (const id of managed) {
		stacks.push({
			id,
			name: id,
			status: projectMap[id] ? "running" : "stopped",
			services: projectMap[id] || 0,
			type: "standalone",
			managedBy: "panal",
		});
	}
	// External (running projects not in managed dir)
	for (const project in projectMap) {
		if (!managed.includes(project)) {
			stacks.push({
				id: project,
				name: project,
				status: "running",
				services: projectMap[project],
				type: "standalone",
				managedBy: "external",
			});
		}
	}
	return stacks;
}

// Swarm: get stacks from docker stack ls and STACKS_LOCATION
async function getSwarmStacks(): Promise<Stack[]> {
	try {
		const stacks: Stack[] = [];
		const managed = await getPanalManagedStacks();
		const { exec } = await import("node:child_process");
		const execAsync = (cmd: string) =>
			new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
				exec(cmd, (err, stdout, stderr) => {
					if (err) reject(err);
					else resolve({ stdout, stderr });
				});
			});
		const { stdout } = await execAsync("docker stack ls --format '{{json .}}'");
		const lines = stdout.trim().split("\n");
		for (const line of lines) {
			if (!line) continue;
			const obj = JSON.parse(line);
			const isManaged = managed.includes(obj.Name);
			stacks.push({
				id: obj.Name,
				name: obj.Name,
				status: obj.Services === "0" ? "stopped" : "running",
				services: Number.parseInt(obj.Services, 10),
				type: "swarm",
				managedBy: isManaged ? "panal" : "external",
			});
		}
		// Add managed stacks not currently running in Swarm
		for (const id of managed) {
			if (!stacks.find((s) => s.id === id)) {
				stacks.push({
					id,
					name: id,
					status: "stopped",
					services: 0,
					type: "swarm",
					managedBy: "panal",
				});
			}
		}
		return stacks;
	} catch {
		return [];
	}
}

export async function getStacks(): Promise<Stack[]> {
	if (await isSwarmActive()) {
		return await getSwarmStacks();
	}
	return await getUserDefinedStacksStandalone();
}

export async function getStackById(id: string): Promise<Stack | undefined> {
	const stacks = await getStacks();
	return stacks.find((stack) => stack.id === id);
}

export async function isSwarmActive(): Promise<boolean> {
	try {
		const info = await docker.info();
		return info?.Swarm?.LocalNodeState === "active";
	} catch {
		return false;
	}
}
