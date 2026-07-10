"use client";

interface PageIntroPanelProps {
  title: string;
  subtitle: string;
  variant?: "sky" | "emerald";
  actions?: React.ReactNode;
}

export default function PageIntroPanel({
  title,
  subtitle,
  variant = "sky",
  actions,
}: PageIntroPanelProps) {
  const variantClass =
    variant === "emerald"
      ? "border-emerald-100 from-white via-emerald-50/70 to-cyan-50/70"
      : "border-sky-100 from-white via-sky-50/70 to-indigo-50/70";

  return (
    <div className={`mb-6 rounded-3xl border bg-gradient-to-r px-5 py-5 shadow-sm ${variantClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">{title}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
