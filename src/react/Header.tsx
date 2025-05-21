import { Box, Menu, User } from "lucide-react";
import React from "react";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
	// Mobile sidebar toggle (optional: implement with context if needed)
	return (
		<header className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-end px-6">
			<div className="md:hidden flex items-center">
				<button
					id="sidebar-toggle"
					aria-label="Toggle Sidebar"
					className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
					type="button"
				>
					<Menu className="h-5 w-5" />
				</button>
				<a
					href="/"
					className="flex items-center gap-2 font-semibold text-xl ml-2 text-orange-500"
				>
					<Box className="h-6 w-6" />
					<span>Panal</span>
				</a>
			</div>
			<div className="flex items-center gap-4">
				<div className="relative">
					<button
						id="user-menu-button"
						aria-label="User Menu"
						className="flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-800 p-2 rounded-md"
						type="button"
					>
						<span className="hidden sm:inline-block">Admin</span>
						<User className="h-5 w-5" />
					</button>
				</div>
				<ThemeToggle />
			</div>
		</header>
	);
} 