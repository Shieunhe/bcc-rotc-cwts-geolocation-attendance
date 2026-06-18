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

  function isPathActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function renderNavItem(item: NavItem) {
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      const isParentRouteActive = isPathActive(item.href);
      const isChildActive = item.children!.some((child) => isPathActive(child.href));
      const isSectionActive = isParentRouteActive || isChildActive;
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
              ${isSectionActive
                ? "border border-white/70 bg-white text-slate-900 shadow-[0_18px_34px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.92)]"
                : "text-white hover:bg-white/10 hover:text-white hover:shadow-sm"
              }
            `}
          >
            <span
              className={`
                flex h-10 w-10 items-center justify-center rounded-xl transition-colors
                ${isSectionActive
                  ? "bg-gradient-to-br from-sky-100 to-blue-100 text-sky-700 shadow-inner shadow-white/60"
                  : "bg-white/0 text-white group-hover:bg-white/10 group-hover:text-white"
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
            <div className="relative ml-6 mt-2 space-y-1 pl-4 before:absolute before:bottom-1 before:left-0 before:top-1 before:w-[2px] before:rounded-full before:bg-white/75 before:shadow-[0_0_0_1px_rgba(255,255,255,0.28),0_0_16px_rgba(255,255,255,0.65),2px_0_14px_rgba(255,255,255,0.22)]">
              {item.children!.map((child) => {
                const isActive = isPathActive(child.href);
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onClose}
                    className={`
                      group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200
                      ${isActive
                        ? "border border-white/70 bg-white text-slate-900 shadow-[0_14px_28px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]"
                        : "text-white hover:bg-white/10 hover:text-white"
                      }
                    `}
                  >
                    <span
                      className={`
                        flex h-8 w-8 items-center justify-center rounded-lg transition-colors
                        ${isActive
                          ? "bg-sky-100 text-sky-700"
                          : "bg-transparent text-white group-hover:bg-white/10 group-hover:text-white"
                        }
                      `}
                    >
                      {child.icon}
                    </span>
                    <span>{child.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const isActive = isPathActive(item.href);
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
            ? "border border-white/70 bg-white text-slate-900 shadow-[0_18px_34px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.92)]"
            : "text-white hover:bg-white/10 hover:text-white hover:shadow-sm"
          }
        `}
      >
        <span
          className={`
            flex h-10 w-10 items-center justify-center rounded-xl transition-colors
            ${isActive
              ? "bg-sky-100 text-sky-700"
              : "bg-transparent text-white group-hover:bg-white/10 group-hover:text-white"
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
          fixed top-0 left-0 z-30 h-full w-72 overflow-hidden
          shadow-2xl shadow-slate-950/30 backdrop-blur-xl
          flex flex-col transition-[width,transform] duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${collapsed ? "lg:w-24" : "lg:w-72"}
          lg:translate-x-0 lg:static lg:z-auto lg:overflow-visible
        `}
        style={{ background: "linear-gradient(180deg, #67a9e8 0%, #5c9fdf 45%, #4f93d3 100%)" }}
      >
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-r from-white/18 via-sky-100/16 to-transparent blur-3xl pointer-events-none" />
        <div
          className={`
            relative flex items-center px-5 py-6
            ${collapsed ? "justify-center" : "gap-3"}
          `}
        >
          <div className="relative z-10 shrink-0">
            <div style={{ filter: "drop-shadow(0 10px 18px rgba(15, 23, 42, 0.25))" }}>
              <Logo className="h-16 w-16 rounded-3xl bg-white p-2 object-contain shadow-[0_12px_28px_rgba(15,23,42,0.22)] ring-1 ring-white" />
            </div>
          </div>

          {!collapsed && (
            <div className="relative z-10 min-w-0 leading-tight">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white">{title}</p>
              <p className="mt-1 text-xs text-white">{subtitle}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleDesktopToggle}
            className={`absolute z-20 hidden h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-white text-sky-700 shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-white hover:text-sky-800 hover:shadow-xl lg:flex ${
              collapsed ? "top-7" : "-right-3 top-7"
            }`}
            style={collapsed ? { right: "-34px" } : undefined}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <SidebarToggleIcon collapsed={collapsed} />
          </button>

          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg text-white hover:text-white hover:bg-white/10 lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav
          className={`
          mx-3 my-4 flex-1 space-y-1 overflow-y-auto rounded-[28px] bg-[#4f93d3]/24 p-2.5
            shadow-[0_18px_40px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.2)]
            ${collapsed ? "px-2 py-3" : "px-2.5 py-3"}
          `}
        >
          {navItems.map((item) => renderNavItem(item))}
        </nav>

        <div className="px-3 py-4">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title={collapsed ? "Logout" : undefined}
            className={`
              group flex w-full items-center rounded-2xl font-medium text-white transition-all duration-200 disabled:opacity-50
              ${collapsed ? "justify-center px-2.5 py-3.5" : "gap-3 px-3.5 py-3 text-sm"}
              hover:bg-white/8
            `}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-colors group-hover:bg-white/14">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
            {!collapsed && <span>{loggingOut ? "Logging out..." : "Logout"}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
