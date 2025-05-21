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

const mockNodes: Node[] = [
	{
		id: "node1",
		hostname: "panal-manager-01",
		status: "ready",
		role: "manager",
		leader: true,
		cpu: {
			cores: 4,
			usage: 25,
		},
		memory: {
			total: "8 GB",
			usage: 40,
		},
		disk: {
			total: "100 GB",
			usage: 30,
		},
		services: ["web-stack_web", "web-stack_api", "monitoring_prometheus"],
	},
	{
		id: "node2",
		hostname: "panal-worker-01",
		status: "ready",
		role: "worker",
		leader: false,
		cpu: {
			cores: 2,
			usage: 60,
		},
		memory: {
			total: "4 GB",
			usage: 75,
		},
		disk: {
			total: "50 GB",
			usage: 45,
		},
		services: ["web-stack_redis", "db-stack_postgres", "monitoring_grafana"],
	},
	{
		id: "node3",
		hostname: "panal-worker-02",
		status: "down",
		role: "worker",
		leader: false,
		cpu: {
			cores: 2,
			usage: 0,
		},
		memory: {
			total: "4 GB",
			usage: 0,
		},
		disk: {
			total: "50 GB",
			usage: 60,
		},
		services: [],
	},
];

export async function getNodes(): Promise<Node[]> {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 100));
	return mockNodes;
}

export async function getNodeById(id: string): Promise<Node | undefined> {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 100));
	return mockNodes.find((node) => node.id === id);
}
