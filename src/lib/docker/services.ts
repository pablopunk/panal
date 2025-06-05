import { execSync, spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import Docker from "dockerode";
import DockerCompose from "dockerode-compose";
import { STACKS_DIR } from "../config";
import { logger } from "../logger";

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

const STACKS_LOCATION = STACKS_DIR;

export async function runStackDeployOrUpdate({
  id,
  name,
  compose,
  env,
}: {
  id: string;
  name?: string; // for create
  compose: string;
  env?: string;
}): Promise<{ success: boolean; message?: string }> {
  const stackName = name || id;
  const stackDir = path.join(STACKS_LOCATION, stackName);
  try {
    await fs.mkdir(stackDir, { recursive: true });
    await fs.writeFile(path.join(stackDir, "docker-compose.yml"), compose);
    await fs.writeFile(path.join(stackDir, ".env"), env || "");
    const logPath = path.join(stackDir, "deploy.log");
    const swarm = await isSwarmActive();
    const logStream = await fs.open(logPath, "w");
    if (swarm) {
      logger.info("Deploying stack via docker stack", { stack: stackName });
      const proc = spawn(
        "docker",
        ["stack", "deploy", "-c", "docker-compose.yml", stackName],
        { cwd: stackDir },
      );
      proc.stdout?.on("data", (d) => logStream.write(d));
      proc.stderr?.on("data", (d) => logStream.write(d));
      const exitCode: number = await new Promise((resolve) =>
        proc.on("close", (code) => resolve(code ?? 0)),
      );
      await logStream.write(`\n[Process exited with code ${exitCode}]\n`);
      await logStream.close();
      if (exitCode !== 0) {
        return { success: false, message: `stack deploy exited ${exitCode}` };
      }
    } else {
      logger.info("Deploying stack via Docker Engine API", { stack: stackName });
      const composeClient = new DockerCompose(
        docker,
        path.join(stackDir, "docker-compose.yml"),
        stackName,
      );
      try {
        const result = await composeClient.up();
        await logStream.write(JSON.stringify(result, null, 2));
        await logStream.close();
      } catch (err) {
        await logStream.write(String(err));
        await logStream.close();
        return { success: false, message: String(err) };
      }
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function runStackRemove({
  id,
}: { id: string }): Promise<{ success: boolean; message?: string }> {
  if (!id) return { success: false, message: "Missing stack id" };
  const stackDir = path.join(STACKS_LOCATION, id);
  try {
    const swarm = await isSwarmActive();
    if (swarm) {
      logger.info("Removing stack via docker stack", { stack: id });
      const proc = spawn("docker", ["stack", "rm", id]);
      const exitCode: number = await new Promise((resolve) =>
        proc.on("close", (code) => resolve(code ?? 0)),
      );
      if (exitCode !== 0) {
        return { success: false, message: `stack rm exited ${exitCode}` };
      }
    } else {
      const composeClient = new DockerCompose(
        docker,
        path.join(stackDir, "docker-compose.yml"),
        id,
      );
      try {
        await composeClient.down();
      } catch (err) {
        logger.error("Compose down failed", err);
      }
    }
    await fs.rm(stackDir, { recursive: true, force: true });
    return { success: true };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function runStackAction({
  id,
  action,
}: { id: string; action: "deploy" | "remove" | "restart" }): Promise<{
  success: boolean;
  message?: string;
}> {
  if (action === "deploy" || action === "restart") {
    // Read compose and env from disk
    const stackDir = path.join(STACKS_LOCATION, id);
    try {
      const composePath = path.join(stackDir, "docker-compose.yml");
      const envPath = path.join(stackDir, ".env");
      const compose = await fs.readFile(composePath, "utf-8");
      const env = await fs.readFile(envPath, "utf-8").catch(() => "");
      return await runStackDeployOrUpdate({ id, compose, env });
    } catch (err) {
      return { success: false, message: `Failed to read stack files: ${err}` };
    }
  }

  if (action === "remove") {
    return await runStackRemove({ id });
  }
  return { success: false, message: "Invalid action" };
}
