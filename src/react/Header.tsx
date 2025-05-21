import { navigate } from "astro:transitions/client";
import {
	Box,
	LogOut,
	Menu,
	Settings as SettingsIcon,
	User,
} from "lucide-react";
import React, { useRef, useState } from "react";
import ThemeToggle from "./ThemeToggle";

export default function Header({ user }: { user: string | null }) {
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	// Close menu on outside click
	React.useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setMenuOpen(false);
			}
		}
		if (menuOpen) {
			document.addEventListener("mousedown", handleClick);
			return () => document.removeEventListener("mousedown", handleClick);
		}
	}, [menuOpen]);

	const handleLogout = async () => {
		await fetch("/api/auth/logout", { method: "POST" });
		window.location.href = "/login";
	};

	const handleSettings = () => {
		navigate("/settings");
	};

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
				<div className="relative" ref={menuRef}>
					<button
						id="user-menu-button"
						aria-label="User Menu"
						className="flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-800 p-2 rounded-md"
						type="button"
						onClick={() => setMenuOpen((v) => !v)}
					>
						<span className="hidden sm:inline-block">{user ?? "..."}</span>
						<User className="h-5 w-5" />
					</button>
					{menuOpen && (
						<div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg z-50">
							<button
								onClick={handleSettings}
								type="button"
								className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
							>
								<SettingsIcon className="h-4 w-4" />
								Settings
							</button>
							<button
								onClick={handleLogout}
								type="button"
								className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600"
							>
								<LogOut className="h-4 w-4" />
								Logout
							</button>
						</div>
					)}
				</div>
				<ThemeToggle />
			</div>
		</header>
	);
} 