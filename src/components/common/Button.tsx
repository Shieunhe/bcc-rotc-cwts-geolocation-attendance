import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "success";
  fullWidth?: boolean;
}

export default function Button({
  children,
  loading = false,
  variant = "primary",
  fullWidth = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "flex items-center justify-center gap-2 font-semibold rounded-xl py-2.5 sm:py-3 text-sm sm:text-base transition-colors shadow-sm cursor-pointer disabled:opacity-60";

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800",
    danger: "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white",
    success: "bg-green-600 hover:bg-green-700 active:bg-green-800 text-white",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading...
        </>
      ) : children}
    </button>
  );
}
