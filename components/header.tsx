"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { LogOut, Users, ClipboardList, Trophy, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const LV_LOGO_URL = "/lv-logo.jpg";

export function Header() {
  const sessionData = useSession();
  const session = sessionData?.data;
  const status = sessionData?.status ?? "loading";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  

  // Prevent hydration mismatch by not rendering auth-dependent content until mounted
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 bg-green-900/80 backdrop-blur-md border-b border-green-700/50">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white shadow-md">
                <Image
                  src={LV_LOGO_URL}
                  alt="LV Logo"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">LV Team Builder</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-green-900/80 backdrop-blur-md border-b border-green-700/50">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white shadow-md">
              <Image
                src={LV_LOGO_URL}
                alt="LV Logo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">LV Team Builder</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {status === "authenticated" && (
              <>
                <NavLink href="/checkin" icon={<ClipboardList className="w-4 h-4" />}>
                  Check-in
                </NavLink>
                <NavLink href="/teams" icon={<Trophy className="w-4 h-4" />}>
                  Teams
                </NavLink>
                <NavLink href="/admin" icon={<Users className="w-4 h-4" />}>
                    Admin
                  </NavLink>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => signOut?.({ callbackUrl: "/" })}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-200 hover:bg-red-500/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </motion.button>
              </>
            )}
            {status === "unauthenticated" && (
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                Sign In
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-4 border-t border-green-700/50"
          >
            <nav className="flex flex-col gap-2">
              {status === "authenticated" && (
                <>
                  <MobileNavLink href="/checkin" onClick={() => setMobileMenuOpen(false)}>
                    <ClipboardList className="w-5 h-5" /> Check-in
                  </MobileNavLink>
                  <MobileNavLink href="/teams" onClick={() => setMobileMenuOpen(false)}>
                    <Trophy className="w-5 h-5" /> Teams
                  </MobileNavLink>
                  <MobileNavLink href="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <Users className="w-5 h-5" /> Admin
                    </MobileNavLink>
                  <button
                    onClick={() => signOut?.({ callbackUrl: "/" })}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-200 bg-red-500/20"
                  >
                    <LogOut className="w-5 h-5" /> Sign Out
                  </button>
                </>
              )}
              {status === "unauthenticated" && (
                <MobileNavLink href="/login" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </MobileNavLink>
              )}
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
}

function NavLink({ href, children, icon }: { href: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-white/10 hover:bg-white/20 transition-colors"
      >
        {icon}
        {children}
      </motion.div>
    </Link>
  );
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-white bg-white/10"
    >
      {children}
    </Link>
  );
}
