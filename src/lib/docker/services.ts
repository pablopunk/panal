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

const mockServices: Service[] = [
	{
		id: "web-1",
		name: "web-stack_web",
		stackId: "web-stack",
		status: "running",
		replicas: 2,
		image: "nginx:alpine",
		ports: [{ published: 8080, target: 80, protocol: "tcp" }],
	},
	{
		id: "api-1",
		name: "web-stack_api",
		stackId: "web-stack",
		status: "running",
		replicas: 2,
		image: "node:16-alpine",
		ports: [{ published: 3000, target: 3000, protocol: "tcp" }],
	},
	{
		id: "redis-1",
		name: "web-stack_redis",
		stackId: "web-stack",
		status: "running",
		replicas: 1,
		image: "redis:alpine",
		ports: [],
	},
	{
		id: "postgres-1",
		name: "db-stack_postgres",
		stackId: "db-stack",
		status: "running",
		replicas: 1,
		image: "postgres:14-alpine",
		ports: [{ published: 5432, target: 5432, protocol: "tcp" }],
	},
	{
		id: "mongo-1",
		name: "db-stack_mongo",
		stackId: "db-stack",
		status: "running",
		replicas: 1,
		image: "mongo:5",
		ports: [{ published: 27017, target: 27017, protocol: "tcp" }],
	},
	{
		id: "prometheus",
		name: "monitoring_prometheus",
		stackId: "monitoring",
		status: "running",
		replicas: 1,
		image: "prom/prometheus",
		ports: [{ published: 9090, target: 9090, protocol: "tcp" }],
	},
	{
		id: "grafana",
		name: "monitoring_grafana",
		stackId: "monitoring",
		status: "running",
		replicas: 1,
		image: "grafana/grafana",
		ports: [{ published: 3001, target: 3000, protocol: "tcp" }],
	},
	{
		id: "alertmanager",
		name: "monitoring_alertmanager",
		stackId: "monitoring",
		status: "stopped",
		replicas: 0,
		image: "prom/alertmanager",
		ports: [{ published: 9093, target: 9093, protocol: "tcp" }],
	},
	{
		id: "external-service",
		name: "external-stack_service",
		stackId: "external-stack",
		status: "running",
		replicas: 1,
		image: "nginx:latest",
		ports: [{ published: 8081, target: 80, protocol: "tcp" }],
	},
];

export async function getServices(): Promise<Service[]> {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 100));
	return mockServices;
}

export async function getServicesByStackId(
	stackId: string,
): Promise<Service[]> {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 100));
	return mockServices.filter((service) => service.stackId === stackId);
}

export async function getServiceById(id: string): Promise<Service | undefined> {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 100));
	return mockServices.find((service) => service.id === id);
}
