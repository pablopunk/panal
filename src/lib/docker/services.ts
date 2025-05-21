import Docker from "dockerode";

const docker = new Docker();

// Mock data for services

export interface Port {
	published: number;
	target: number;
	protocol: "tcp" | "udp";
}

export interface Service {
	id: string;
	name: string;
	stackId: string;
	status: "running" | "stopped";
	replicas: number;
	image: string;
	ports: Port[];
}

function dedupePorts(ports: Port[]): Port[] {
	const seen = new Set();
	return ports.filter((p) => {
		const key = `${p.published}:${p.target}:${p.protocol}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

export async function isSwarmActive(): Promise<boolean> {
	try {
		const info = await docker.info();
		return info?.Swarm?.LocalNodeState === "active";
	} catch {
		return false;
	}
}

// Helper: parse stack name from service name (Swarm convention: stack_service)
function getStackIdFromServiceName(name: string): string {
	const idx = name.indexOf("_");
	return idx > 0 ? name.slice(0, idx) : name;
}

function isContainerTaskSpec(
	task: unknown,
): task is { ContainerSpec: { Image: string } } {
	if (typeof task !== "object" || task === null) return false;
	const rec = task as Record<string, unknown>;
	if (!("ContainerSpec" in rec)) return false;
	const containerSpec = (rec as { ContainerSpec?: unknown }).ContainerSpec as
		| Record<string, unknown>
		| undefined;
	return !!containerSpec && typeof containerSpec.Image === "string";
}

async function getSwarmServices(): Promise<Service[]> {
	const services: Service[] = [];
	const dockerServices = await docker.listServices();
	for (const svc of dockerServices) {
		const spec = svc.Spec;
		if (!spec) continue;
		const name = spec.Name || "";
		const stackId = getStackIdFromServiceName(name);
		// Get replicas
		let replicas = 1;
		if (
			spec.Mode?.Replicated &&
			typeof spec.Mode.Replicated.Replicas === "number"
		) {
			replicas = spec.Mode.Replicated.Replicas;
		}
		// Get image
		let image = "";
		if (isContainerTaskSpec(spec.TaskTemplate)) {
			image = spec.TaskTemplate.ContainerSpec.Image;
		}
		// Get ports
		let ports: Port[] = [];
		const endpoint = svc.Endpoint;
		if (endpoint?.Ports) {
			for (const p of endpoint.Ports) {
				if (
					typeof p.PublishedPort === "number" &&
					typeof p.TargetPort === "number" &&
					p.Protocol
				) {
					ports.push({
						published: p.PublishedPort,
						target: p.TargetPort,
						protocol:
							p.Protocol === "tcp" || p.Protocol === "udp" ? p.Protocol : "tcp",
					});
				}
			}
		}
		ports = dedupePorts(ports);
		// Status: if replicas > 0, running
		const status = replicas > 0 ? "running" : "stopped";
		services.push({
			id: svc.ID,
			name,
			stackId,
			status,
			replicas,
			image,
			ports,
		});
	}
	return services;
}

async function getStandaloneServices(): Promise<Service[]> {
	const containers = await docker.listContainers({ all: true });
	// Group by compose project (stackId)
	const services: Service[] = [];
	for (const c of containers) {
		const stackId = c.Labels["com.docker.compose.project"] || "standalone";
		const name = c.Names?.[0]?.replace(/^\//, "") || c.Id;
		const status = c.State === "running" ? "running" : "stopped";
		// Ports
		let ports: Port[] = [];
		for (const p of c.Ports || []) {
			if (
				typeof p.PublicPort === "number" &&
				typeof p.PrivatePort === "number"
			) {
				ports.push({
					published: p.PublicPort,
					target: p.PrivatePort,
					protocol: p.Type === "tcp" || p.Type === "udp" ? p.Type : "tcp",
				});
			}
		}
		ports = dedupePorts(ports);
		services.push({
			id: c.Id,
			name,
			stackId,
			status,
			replicas: 1,
			image: c.Image,
			ports,
		});
	}
	return services;
}

export async function getServices(): Promise<Service[]> {
	if (await isSwarmActive()) {
		return await getSwarmServices();
	}
	return await getStandaloneServices();
}

export async function getServicesByStackId(
	stackId: string,
): Promise<Service[]> {
	const all = await getServices();
	return all.filter((svc) => svc.stackId === stackId);
}

export async function getServiceById(id: string): Promise<Service | undefined> {
	const all = await getServices();
	return all.find((svc) => svc.id === id);
}
