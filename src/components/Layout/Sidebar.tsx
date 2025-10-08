import React from "react";
import {
  LayoutDashboard,
  Images,
  Users,
  Settings,
  FileText,
  BarChart3,
  Upload,
  Search,
  FolderOpen,
  UserCheck,
  Handshake,
  MessageSquare,
  Mail,
} from "lucide-react";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  userEmail?: string;
  className?: string;
}

const menuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Табло" },
  { id: "images", icon: Images, label: "Галерия" },
  { id: "portfolio-galleries", icon: FolderOpen, label: "Портфолио" },
  { id: "client-galleries", icon: UserCheck, label: "Клиентски Галерии" },
  { id: "partners", icon: Handshake, label: "Партньори" },
  { id: "inquiries", icon: MessageSquare, label: "Запитвания" },
  { id: "contacts", icon: Mail, label: "Контакти" },
  { id: "upload", icon: Upload, label: "Качване" },
  { id: "users", icon: Users, label: "Потребители" },
  { id: "content", icon: FileText, label: "Съдържание" },
  { id: "analytics", icon: BarChart3, label: "Анализи" },
  { id: "settings", icon: Settings, label: "Настройки" },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSectionChange,
  userEmail,
  className,
}) => {
  return (
    <div
      className={`relative flex h-full min-h-full w-full flex-col overflow-hidden bg-gradient-to-b from-boho-brown via-boho-rust to-boho-terracotta text-boho-cream shadow-2xl ${className ?? ""}`}
    >
      <div className="absolute inset-0 opacity-40">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(222,184,135,0.35),transparent_55%)]" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="px-6 pb-6 pt-10">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-boho-cream boho-heading">
              Evermore Admin
            </h1>
            <p className="text-sm text-boho-warm/90 font-light">
              Творческа естетика, управлявана с лекота
            </p>
          </div>
        </div>

        <div className="relative z-10 px-4 pb-4">
          <div className="group relative flex items-center rounded-[var(--ever-radius-md)] border border-boho-cream/10 bg-boho-cream/10 px-4 py-3 text-sm backdrop-blur-lg transition-all duration-300 focus-within:border-boho-cream/40">
            <Search className="mr-3 h-4 w-4 text-boho-cream/80" />
            <input
              type="text"
              placeholder="Търсене..."
              className="w-full bg-transparent text-boho-cream placeholder:text-boho-warm/70 focus:outline-none"
            />
          </div>
        </div>

        <nav className="relative z-10 flex-1 overflow-y-auto px-3 pb-6">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => onSectionChange(item.id)}
                    className={`group relative flex w-full items-center gap-3 rounded-[var(--ever-radius-md)] px-4 py-3 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-boho-cream/15 text-boho-cream shadow-lg shadow-boho-brown/20"
                        : "text-boho-warm/90 hover:bg-boho-cream/10 hover:text-boho-cream"
                    }`}
                  >
                    <span
                      className={`absolute inset-y-2 left-2 w-[3px] rounded-full transition-all duration-300 ${
                        isActive
                          ? "bg-boho-cream"
                          : "bg-transparent group-hover:bg-boho-cream/60"
                      }`}
                    />
                    <span className="relative flex h-10 w-10 items-center justify-center rounded-[var(--ever-radius-sm)] bg-boho-cream/10 text-boho-cream/80 transition-colors duration-300 group-hover:bg-boho-cream/20">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="relative font-boho text-base tracking-wide">
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="relative z-10 border-t border-boho-cream/10 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-boho-cream/20 bg-boho-cream/10">
              <span className="text-lg font-semibold font-script text-boho-cream">
                {userEmail ? userEmail.charAt(0).toUpperCase() : "А"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold font-boho text-boho-cream">
                Админ Потребител
              </p>
              <p
                className="truncate text-sm text-boho-warm/80"
                title={userEmail}
              >
                {userEmail || "admin@example.com"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
