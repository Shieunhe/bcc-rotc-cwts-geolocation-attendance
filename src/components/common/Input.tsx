"use client";

import { InputHTMLAttributes, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export default function Input({ label, icon, type, className = "", ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const labelEl = label ? (
    <label className="block text-sm font-semibold text-slate-600 mb-1.5">{label}</label>
  ) : null;

  const togglePw = isPassword ? (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute inset-y-0 right-2 flex items-center rounded-lg px-1 text-slate-400 hover:text-slate-600 transition-colors"
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  ) : null;

  const fieldRing =
    "rounded-xl border border-slate-200/95 bg-white shadow-sm transition focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-blue-500/25";

  const inputBase =
    "w-full bg-transparent py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0";

  if (icon) {
    return (
      <div>
        {labelEl}
        <div className={`flex overflow-hidden ${fieldRing}`}>
          <span className="flex w-11 shrink-0 items-center justify-center border-r border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/90 text-slate-500">
            {icon}
          </span>
          <div className="relative min-w-0 flex-1">
            <input
              type={inputType}
              className={`${inputBase} pl-3 ${isPassword ? "pr-11" : "pr-3"} rounded-none rounded-r-xl ${className}`}
              {...props}
            />
            {togglePw}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {labelEl}
      <div className={`relative ${fieldRing}`}>
        <input
          type={inputType}
          className={`${inputBase} px-4 ${isPassword ? "pr-11" : ""} rounded-xl ${className}`}
          {...props}
        />
        {togglePw}
      </div>
    </div>
  );
}
