import { Moon, Sun } from "lucide-react";
import React, { useEffect, useState } from "react";

const STORAGE_THEME_KEY = "theme";
const DARK_THEME_CLASS = "dark";
const DARK = "dark";
const LIGHT = "light";

function getUserPreferences() {
	if (typeof window !== "undefined" && window.localStorage) {
		const stored = localStorage.getItem(STORAGE_THEME_KEY);
		if (stored) return stored;
		if (window.matchMedia("(prefers-color-scheme: light)").matches)
			return LIGHT;
	}
	return DARK;
}

export default function ThemeToggle() {
	const [isDark, setIsDark] = useState(true);

	useEffect(() => {
		const theme = getUserPreferences();
		setIsDark(theme === DARK);
		document.documentElement.classList.toggle(DARK_THEME_CLASS, theme === DARK);
	}, []);

	const handleClick = () => {
		const newIsDark = !isDark;
		setIsDark(newIsDark);
		document.documentElement.classList.toggle(DARK_THEME_CLASS, newIsDark);
		localStorage.setItem(STORAGE_THEME_KEY, newIsDark ? DARK : LIGHT);
	};

	useEffect(() => {
		const handler = () => {
			const theme = getUserPreferences();
			setIsDark(theme === DARK);
			document.documentElement.classList.toggle(
				DARK_THEME_CLASS,
				theme === DARK,
			);
		};
		window.addEventListener("astro:after-swap", handler);
		return () => window.removeEventListener("astro:after-swap", handler);
	}, []);

	return (
		<button
			id="theme-toggle"
			type="button"
			onClick={handleClick}
			aria-label="Toggle theme"
		>
			{isDark ? <Moon /> : <Sun />}
		</button>
	);
} 