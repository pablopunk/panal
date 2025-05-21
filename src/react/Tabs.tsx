import type React from "react";
import { useState } from "react";

interface Tab {
	label: string;
	content: React.ReactNode;
}

interface TabsProps {
	tabs: Tab[];
	initialIndex?: number;
	className?: string;
}

export default function Tabs({
	tabs,
	initialIndex = 0,
	className = "",
}: TabsProps) {
	const [active, setActive] = useState(initialIndex);
	return (
		<div className={`w-full ${className}`}>
			<div
				role="tablist"
				className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-2"
			>
				{tabs.map((tab, i) => (
					<button
						key={tab.label}
						role="tab"
						aria-selected={active === i}
						aria-controls={`tab-panel-${i}`}
						className={`px-4 py-2 rounded-t-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
							active === i
								? "bg-white dark:bg-gray-900 border-b-2 border-emerald-500 text-emerald-700 dark:text-emerald-400"
								: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
						}`}
						onClick={() => setActive(i)}
						tabIndex={active === i ? 0 : -1}
						type="button"
					>
						{tab.label}
					</button>
				))}
			</div>
			<div
				id={`tab-panel-${active}`}
				role="tabpanel"
				className="p-4 bg-white dark:bg-gray-900 rounded-b-md"
			>
				{tabs[active].content}
			</div>
		</div>
	);
} 