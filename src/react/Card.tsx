import type React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	title?: string;
	className?: string;
	children: React.ReactNode;
}

export default function Card({
	title,
	className = "",
	children,
	...rest
}: CardProps) {
	return (
		<div
			className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm ${className}`}
			{...rest}
		>
			{title && (
				<div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
					<h3 className="text-lg font-medium">{title}</h3>
				</div>
			)}
			<div className="p-3">{children}</div>
		</div>
	);
}
