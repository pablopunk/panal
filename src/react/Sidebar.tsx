import {
	Box,
	FileText,
	Layers,
	Menu,
	Network,
	Settings,
	Terminal,
} from "lucide-react";
import React, { useState } from "react";

const topNavItems = [
	{ name: "Stacks", icon: <Layers className="h-6 w-6" />, href: "/" },
	{ name: "Cluster", icon: <Network className="h-6 w-6" />, href: "/cluster" },
	{
		name: "Terminal",
		icon: <Terminal className="h-6 w-6" />,
		href: "/terminal",
	},
	{
		name: "Docker Logs",
		icon: <FileText className="h-6 w-6" />,
		href: "/docker-logs",
	},
];
const bottomNavItems = [
	{
		name: "Settings",
		icon: <Settings className="h-6 w-6" />,
		href: "/settings",
	},
];

export default function Sidebar() {
	const [collapsed, setCollapsed] = useState(true);
	const [hovered, setHovered] = useState(false);
	const pathname =
		typeof window !== "undefined" ? window.location.pathname : "/";

	const expanded = !collapsed;

	return (
		<aside
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			className={`transition-all duration-200 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 hidden md:flex flex-col h-full ${expanded ? "w-64" : "w-20"}`}
		>
			<div className="flex flex-col h-full flex-1">
				<div>
					<div className="p-3 pb-0 flex items-center transition-all duration-200">
						<div className="relative h-12 w-full flex items-center ">
							<div className="px-3 absolute inset-0 flex items-center gap-2 font-semibold text-xl text-orange-600 dark:text-orange-400 transition-opacity duration-200">
								{/* Show Box icon when not hovered, Menu button when hovered, both in the same spot with smooth transition */}
								<span className="flex items-center justify-center h-8 w-8 relative">
									<span
										className={`transition-all duration-200 ${hovered ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100"}`}
									>
										<Box className="h-6 w-6" />
									</span>
									<span
										className={`transition-all duration-200 absolute inset-0 flex items-center justify-center ${hovered ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"}`}
									>
										<button
											type="button"
											onClick={() => setCollapsed((c) => !c)}
											className="flex items-center justify-center h-8 w-8 p-0 rounded-md focus:outline-none bg-transparent z-10"
											aria-label={
												collapsed ? "Expand sidebar" : "Collapse sidebar"
											}
										>
											<Menu className="h-5 w-5" />
										</button>
									</span>
								</span>
								{/* Show Panal text only when expanded */}
								{expanded && (
									<a
										href="/"
										className="transition-all duration-300 font-semibold text-xl text-orange-600 dark:text-orange-400"
										tabIndex={0}
									>
										Panal
									</a>
								)}
							</div>
						</div>
					</div>
				</div>
				<nav className="flex flex-col flex-1 p-4 space-y-1">
					{/* Top nav items */}
					<div className="flex flex-col space-y-1 flex-1">
						{topNavItems.map((item) => (
							<a
								key={item.href}
								href={item.href}
								className={`flex items-center px-3 py-2 rounded-md transition-colors whitespace-nowrap min-w-0 items-center ${
									pathname === item.href ||
									(item.href !== "/" && pathname.startsWith(item.href))
										? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
										: "hover:bg-gray-200 dark:hover:bg-gray-800"
								} ${expanded ? "justify-start w-full" : "justify-center w-12"}`}
								aria-label={item.name}
							>
								<span className="flex items-center justify-center h-8 w-8 flex-shrink-0">
									{item.icon}
								</span>
								{/* Spacer for text, only visible when expanded */}
								{expanded && <span className="w-2" />}
								<span
									className={`transition-opacity duration-200 whitespace-nowrap overflow-hidden ${expanded ? "opacity-100 inline" : "opacity-0 hidden"}`}
								>
									{item.name}
								</span>
							</a>
						))}
					</div>
					{/* Bottom nav items */}
					<div className="flex flex-col space-y-1 pt-2">
						{bottomNavItems.map((item) => (
							<a
								key={item.href}
								href={item.href}
								className={`flex items-center px-3 py-2 rounded-md transition-colors whitespace-nowrap min-w-0 items-center ${
									pathname === item.href ||
									(item.href !== "/" && pathname.startsWith(item.href))
										? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
										: "hover:bg-gray-200 dark:hover:bg-gray-800"
								} ${expanded ? "justify-start w-full" : "justify-center w-12"}`}
								aria-label={item.name}
							>
								<span className="flex items-center justify-center h-8 w-8 flex-shrink-0">
									{item.icon}
								</span>
								{expanded && <span className="w-2" />}
								<span
									className={`transition-opacity duration-200 whitespace-nowrap overflow-hidden ${expanded ? "opacity-100 inline" : "opacity-0 hidden"}`}
								>
									{item.name}
								</span>
							</a>
						))}
					</div>
				</nav>
			</div>
		</aside>
	);
}