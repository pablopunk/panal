// Mock data for stacks

export interface Stack {
  id: string
  name: string
  status: "running" | "partial" | "stopped"
  services: number
  type: "swarm" | "standalone"
  managedBy: "panal" | "external"
}

const mockStacks: Stack[] = [
  {
    id: "web-stack",
    name: "web-stack",
    status: "running",
    services: 3,
    type: "swarm",
    managedBy: "panal",
  },
  {
    id: "db-stack",
    name: "db-stack",
    status: "running",
    services: 2,
    type: "standalone",
    managedBy: "panal",
  },
  {
    id: "monitoring",
    name: "monitoring",
    status: "partial",
    services: 4,
    type: "swarm",
    managedBy: "panal",
  },
  {
    id: "external-stack",
    name: "external-stack",
    status: "running",
    services: 1,
    type: "swarm",
    managedBy: "external",
  },
]

export async function getStacks(): Promise<Stack[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockStacks
}

export async function getStackById(id: string): Promise<Stack | undefined> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockStacks.find((stack) => stack.id === id)
}
