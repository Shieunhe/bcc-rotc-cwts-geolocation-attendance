"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/common/Logo";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  title: string;
  subtitle: string;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 ml-auto transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function SidebarToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "" : "rotate-180"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export default function Sidebar({
  isOpen,
  onClose,
  navItems,
  title,
  subtitle,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const savedState = window.localStorage.getItem("bcc-sidebar-collapsed");
    if (savedState === "true") {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("bcc-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  function toggleDropdown(label: string) {
    setOpenDropdowns((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function handleDesktopToggle() {
    setCollapsed((prev) => !prev);
  }

  async function handleLogout() {
    setLoggingOut(true);
    await signOut(auth);
    router.push("/login");
  }

  function renderNavItem(item: NavItem) {
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      const isChildActive = item.children!.some((child) => pathname === child.href);
      const isExpanded = !collapsed && (openDropdowns[item.label] ?? isChildActive);

      return (
        <div key={item.label}>
          <button
            onClick={() => {
              if (collapsed) {
                setCollapsed(false);
                setOpenDropdowns((prev) => ({ ...prev, [item.label]: true }));
                return;
              }

              toggleDropdown(item.label);
            }}
            title={collapsed ? item.label : undefined}
            className={`
              group flex items-center w-full rounded-2xl font-medium transition-all duration-200
              ${collapsed ? "justify-center px-2.5 py-3.5" : "gap-3 px-3.5 py-3 text-sm"}
              ${isChildActive
                ? "bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 ring-1 ring-white/60"
                : "text-slate-600 hover:bg-white/85 hover:text-slate-900 hover:shadow-sm"
              }
            `}
          >
            <span
              className={`
                flex h-10 w-10 items-center justify-center rounded-xl transition-colors
                ${isChildActive
                  ? "bg-white/18 text-white"
                  : "bg-slate-100/80 text-slate-500 group-hover:bg-sky-50 group-hover:text-sky-700"
                }
              `}
            >
              {item.icon}
            </span>
            {!collapsed && (
              <>
                <span className="truncate">{item.label}</span>
                <ChevronIcon open={isExpanded} />
              </>
            )}
          </button>

          {isExpanded && (
            <div className="ml-6 mt-2 space-y-1 border-l border-sky-200/80 pl-4">
              {item.children!.map((child) => {
                const isActive = pathname === child.href;
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onClose}
                    className={`
                      group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200
                      ${isActive
                        ? "bg-sky-950 text-white shadow-md shadow-sky-900/20"
                        : "text-slate-500 hover:bg-white/85 hover:text-slate-900"
                      }
                    `}
                  >
                    <span
                      className={`
                        flex h-8 w-8 items-center justify-center rounded-lg transition-colors
                        ${isActive
                          ? "bg-white/12 text-white"
                          : "bg-slate-100/90 text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-700"
                        }
                      `}
                    >
                      {child.icon}
                    </span>
                    {child.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const isActive = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        title={collapsed ? item.label : undefined}
        className={`
          group flex items-center rounded-2xl font-medium transition-all duration-200
          ${collapsed ? "justify-center px-2.5 py-3.5" : "gap-3 px-3.5 py-3 text-sm"}
          ${isActive
            ? "bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 ring-1 ring-white/60"
            : "text-slate-600 hover:bg-white/85 hover:text-slate-900 hover:shadow-sm"
          }
        `}
      >
        <span
          className={`
            flex h-10 w-10 items-center justify-center rounded-xl transition-colors
            ${isActive
              ? "bg-white/18 text-white"
              : "bg-slate-100/80 text-slate-500 group-hover:bg-sky-50 group-hover:text-sky-700"
            }
          `}
        >
          {item.icon}
        </span>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-72 overflow-hidden border-r border-sky-200/70
          bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.24),transparent_34%),linear-gradient(180deg,_rgba(248,251,255,0.98)_0%,_rgba(232,241,255,0.96)_45%,_rgba(217,229,248,0.98)_100%)]
          shadow-2xl shadow-sky-900/10 backdrop-blur-xl
          flex flex-col transition-[width,transform] duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${collapsed ? "lg:w-24" : "lg:w-72"}
          lg:translate-x-0 lg:static lg:z-auto lg:overflow-visible
        `}
      >
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-r from-sky-200/60 via-white/70 to-indigo-200/60 blur-3xl pointer-events-none" />
        <div
          className={`
            relative flex items-center border-b border-white/60 px-5 py-6
            ${collapsed ? "justify-center" : "gap-3"}
          `}
        >
          <div className="relative z-10 shrink-0">
            <Logo className="h-16 w-16 rounded-3xl bg-white/90 p-2 object-contain shadow-lg shadow-sky-900/10 ring-1 ring-white/80" />
          </div>

          {!collapsed && (
            <div className="relative z-10 min-w-0 leading-tight">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700">{title}</p>
              <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleDesktopToggle}
            className={`absolute top-7 hidden h-10 w-10 items-center justify-center rounded-full border border-sky-100 bg-white text-slate-700 shadow-lg shadow-sky-900/10 transition hover:-translate-y-0.5 hover:text-sky-700 hover:shadow-xl lg:flex ${
              collapsed ? "-right-3" : "-right-3"
            }`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <SidebarToggleIcon collapsed={collapsed} />
          </button>

          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav
          className={`
            mx-3 my-4 flex-1 space-y-1 overflow-y-auto rounded-[28px] border border-white/70 bg-white/55 p-2.5
            shadow-[0_24px_60px_-36px_rgba(14,116,144,0.45)]
            ${collapsed ? "px-2 py-3" : "px-2.5 py-3"}
          `}
        >
          {navItems.map((item) => renderNavItem(item))}
        </nav>

        <div className="border-t border-white/70 px-3 py-4">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title={collapsed ? "Logout" : undefined}
            className={`
              group flex w-full items-center rounded-2xl font-medium text-rose-600 transition-all duration-200 disabled:opacity-50
              ${collapsed ? "justify-center px-2.5 py-3.5" : "gap-3 px-3.5 py-3 text-sm"}
              hover:bg-rose-50/90
            `}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 transition-colors group-hover:bg-rose-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
            {!collapsed && (loggingOut ? "Logging out..." : "Logout")}
          </button>
        </div>
      </aside>
    </>
  );
}
