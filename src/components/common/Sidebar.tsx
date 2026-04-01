"use client";

import { useState } from "react";
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

  function toggleDropdown(label: string) {
    setOpenDropdowns((prev) => ({ ...prev, [label]: !prev[label] }));
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
      const isExpanded = openDropdowns[item.label] ?? isChildActive;

      return (
        <div key={item.label}>
          <button
            onClick={() => toggleDropdown(item.label)}
            className={`
              flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isChildActive
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }
            `}
          >
            <span className={isChildActive ? "text-blue-500" : "text-gray-400"}>
              {item.icon}
            </span>
            {item.label}
            <ChevronIcon open={isExpanded} />
          </button>

          {isExpanded && (
            <div className="ml-5 pl-3 mt-1 space-y-0.5 border-l-2 border-gray-100">
              {item.children!.map((child) => {
                const isActive = pathname === child.href;
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all
                      ${isActive
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    <span className={isActive ? "text-white" : "text-gray-400"}>
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
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
          ${isActive
            ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }
        `}
      >
        <span className={isActive ? "text-white" : "text-gray-400"}>
          {item.icon}
        </span>
        {item.label}
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
          fixed top-0 left-0 z-30 h-full w-64 bg-white border-r border-gray-100 shadow-xl
          flex flex-col transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:shadow-none lg:z-auto
        `}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <Logo className="w-16 h-16 object-contain shrink-0" />
          <div className="leading-tight">
            <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">{title}</p>
            <p className="text-[11px] text-gray-400">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => renderNavItem(item))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}
