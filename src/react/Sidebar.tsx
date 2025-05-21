import {
	Box,
	FileText,
	Layers,
	Network,
	Settings,
	Terminal,
} from "lucide-react";
import React from "react";

const navItems = [
	{ name: "Stacks", icon: <Layers className="h-5 w-5" />, href: "/" },
	{ name: "Cluster", icon: <Network className="h-5 w-5" />, href: "/cluster" },
	{
		name: "Terminal",
		icon: <Terminal className="h-5 w-5" />,
		href: "/terminal",
	},
	{
		name: "Docker Logs",
		icon: <FileText className="h-5 w-5" />,
		href: "/docker-logs",
	},
	{
		name: "Settings",
		icon: <Settings className="h-5 w-5" />,
		href: "/settings",
	},
];

export default function Sidebar() {
	const pathname =
		typeof window !== "undefined" ? window.location.pathname : "/";
	return (
		<aside className="w-64 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 hidden md:block">
			<div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-800">
				<a
					href="/"
					className="flex items-center gap-2 font-semibold text-xl text-orange-600 dark:text-orange-400"
				>
					<Box className="h-6 w-6" />
					<span>Panal</span>
				</a>
			</div>
			<nav className="p-4 space-y-1">
				{navItems.map((item) => (
					<a
						key={item.href}
						href={item.href}
						className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
							pathname === item.href ||
							(item.href !== "/" && pathname.startsWith(item.href))
								? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
								: "hover:bg-gray-200 dark:hover:bg-gray-800"
						}`}
					>
						{item.icon}
						<span>{item.name}</span>
					</a>
				))}
			</nav>
		</aside>
	);
} 