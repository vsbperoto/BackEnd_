import React, { useState } from "react";
import { Bell, Settings, LogOut, User, Menu } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onLogout,
  onToggleSidebar,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogout) {
      onLogout();
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <header className="relative z-10 border-b border-boho-brown/10 bg-boho-cream/70 backdrop-blur-xl">
      <div className="flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--ever-radius-md)] border border-boho-brown/10 bg-boho-cream/80 text-boho-brown transition-transform duration-200 hover:-translate-y-0.5 hover:border-boho-brown/30 focus:outline-none focus:ring-2 focus:ring-boho-terracotta/40 lg:hidden"
              aria-label="Отваряне на менюто"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="ever-section-title">Evermore Admin</p>
              <h2 className="text-3xl font-semibold text-boho-brown boho-heading lg:text-4xl">
                {title}
              </h2>
            </div>
          </div>
          {subtitle && (
            <p className="max-w-2xl text-sm text-boho-rust/90 font-boho lg:text-base">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 lg:gap-5">
          <div className="hidden items-center gap-3 rounded-full border border-boho-brown/10 bg-boho-cream/60 px-4 py-2 text-sm text-boho-brown/80 lg:flex">
            <span className="inline-flex h-2 w-2 rounded-full bg-boho-sage" />
            Всичко работи гладко
          </div>

          <button className="relative rounded-[var(--ever-radius-md)] border border-transparent p-3 text-boho-brown transition-all duration-300 hover:-translate-y-0.5 hover:border-boho-brown/10 hover:bg-boho-warm/30">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 inline-flex h-3 w-3 items-center justify-center rounded-full bg-boho-terracotta text-[10px] text-boho-cream"></span>
          </button>

          <button className="rounded-[var(--ever-radius-md)] border border-transparent p-3 text-boho-brown transition-all duration-300 hover:-translate-y-0.5 hover:border-boho-brown/10 hover:bg-boho-warm/30">
            <Settings className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 rounded-[var(--ever-radius-md)] border border-boho-brown/10 bg-boho-cream/70 px-3 py-2 text-left shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-boho-sage to-boho-dusty text-boho-cream">
              <User className="h-5 w-5" />
            </div>
            <div className="hidden text-sm text-boho-brown/90 font-medium lg:block">
              <p className="font-boho">Администратор</p>
              <p className="text-xs text-boho-rust/80">Добре дошли обратно</p>
            </div>
          </div>

          <button
            onClick={handleLogoutClick}
            className="rounded-[var(--ever-radius-md)] border border-transparent p-3 text-boho-brown transition-all duration-300 hover:-translate-y-0.5 hover:border-boho-terracotta/50 hover:bg-boho-terracotta/20"
            title="Изход"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-boho-brown/60 p-4 backdrop-blur-sm">
          <div className="boho-card w-full max-w-md space-y-6 p-8">
            <div className="space-y-2">
              <span className="ever-section-title">Потвърждение</span>
              <h3 className="text-2xl font-semibold text-boho-brown boho-heading">
                Сигурни ли сте, че искате да излезете?
              </h3>
              <p className="text-sm text-boho-rust/90 font-boho">
                Ще трябва да влезете отново, за да продължите работата си в
                панела.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={cancelLogout}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--ever-radius-md)] border border-boho-brown/20 bg-boho-cream/70 px-4 py-3 text-sm font-medium text-boho-brown transition-all duration-200 hover:border-boho-brown/40 hover:bg-boho-cream/90"
              >
                Остани
              </button>
              <button
                onClick={confirmLogout}
                className="boho-button inline-flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-boho-cream"
              >
                Изход
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
