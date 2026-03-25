import Sidebar, { NavItem } from "@/components/common/Sidebar";
import { NSTProgram } from "@/types";

function getNavItems(program: NSTProgram): NavItem[] {
  const base = `/admin/${program.toLowerCase()}`;
  return [
    {
      label: "Dashboard",
      href: `${base}/dashboard`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: "Enrollment Schedule",
      href: `${base}/enrollment-schedule`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: "Enrollment List",
      href: `${base}/enrollment`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
  ];
}

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  program: NSTProgram;
}

export default function AdminSidebarItems({ isOpen, onClose, program }: AdminSidebarProps) {
  return (
    <Sidebar
      isOpen={isOpen}
      onClose={onClose}
      navItems={getNavItems(program)}
      title="BCC NSTP"
      subtitle={`${program} Admin`}
    />
  );
}
