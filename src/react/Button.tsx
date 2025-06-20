import type React from "react";

const variantClasses = {
  primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
  secondary:
    "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  outline:
    "border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2",
  lg: "px-5 py-2.5 text-lg",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  className?: string;
}

export default function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  disabled = false,
  children,
  ...rest
}: ButtonProps) {
  const disabledClass = disabled ? "opacity-50 cursor-not-allowed" : "";
  return (
    <button
      type={type}
      className={`flex gap-1 items-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${disabledClass} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
