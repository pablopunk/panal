import Docker from "dockerode";

const docker = new Docker();

// Mock data for Docker Swarm nodes

export interface Node {
  id: string;
  hostname: string;
  status: "ready" | "down";
  role: "manager" | "worker";
  leader: boolean;
  cpu: {
    cores: number;
    usage: number;
  };
  memory: {
    total: string;
    usage: number;
  };
  disk: {
    total: string;
    usage: number;
  };
  services: string[];
}

async function isSwarmActive(): Promise<boolean> {
  try {
    const info = await docker.info();
    return info?.Swarm?.LocalNodeState === "active";
  } catch {
    return false;
  }
}

export async function getNodes(): Promise<Node[]> {
  if (await isSwarmActive()) {
    const nodes: Node[] = [];
    const dockerNodes = await docker.listNodes();
    const services = await docker.listServices();
    for (const n of dockerNodes) {
      const desc = n.Description;
      const status = n.Status;
      const managerStatus = n.ManagerStatus;
      const nodeServices = services
        .map((svc) => svc.Spec?.Name)
        .filter((name): name is string => typeof name === "string");
      nodes.push({
        id: n.ID,
        hostname: desc?.Hostname || n.ID,
        status: status?.State === "ready" ? "ready" : "down",
        role: n.Spec?.Role === "manager" ? "manager" : "worker",
        leader: !!managerStatus?.Leader,
        cpu: {
          cores: desc?.Resources?.NanoCPUs ? desc.Resources.NanoCPUs / 1e9 : 0,
          usage: 0,
        },
        memory: {
          total: desc?.Resources?.MemoryBytes
            ? `${Math.round(desc.Resources.MemoryBytes / 1024 / 1024)} MB`
            : "-",
          usage: 0,
        },
        disk: {
          total: "-",
          usage: 0,
        },
        services: nodeServices,
      });
    }
    return nodes;
  }
  // Standalone: just show the local Docker host
  const info = await docker.info();
  const containers = await docker.listContainers({ all: true });
  return [
    {
      id: info.ID || "local",
      hostname: info.Name || "localhost",
      status: "ready",
      role: "manager",
      leader: true,
      cpu: {
        cores: info.NCPU || 0,
        usage: 0,
      },
      memory: {
        total: info.MemTotal
          ? `${Math.round(info.MemTotal / 1024 / 1024)} MB`
          : "-",
        usage: 0,
      },
      disk: {
        total: "-",
        usage: 0,
      },
      services: containers.map((c) => c.Names?.[0]?.replace(/^\//, "") || c.Id),
    },
  ];
}

export async function getNodeById(id: string): Promise<Node | undefined> {
  const nodes = await getNodes();
  return nodes.find((node) => node.id === id);
}
