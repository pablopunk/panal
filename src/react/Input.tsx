import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	className?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ label, className = "", id, ...props }, ref) => {
		const inputId = id || props.name || undefined;
		return (
			<div className={`flex flex-col gap-1 ${className}`}>
				{label && (
					<label
						htmlFor={inputId}
						className="text-sm font-medium text-gray-700 dark:text-gray-200"
					>
						{label}
					</label>
				)}
				<input
					id={inputId}
					ref={ref}
					className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
					{...props}
				/>
			</div>
		);
	},
);
Input.displayName = "Input";
export default Input;
