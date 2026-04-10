import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Sparkles, Calendar, BarChart3, Settings, Menu, X,
  ChevronRight, Brain, LogOut, BookOpen, FileText, Linkedin, Instagram,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { User } from '@supabase/supabase-js';
import type { AppRole } from '@/hooks/use-auth';

const navSections = [
  {
    label: 'Work',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/ideas', label: 'Ideas', icon: Brain },
      { path: '/studio', label: 'Create', icon: Sparkles },
      { path: '/blog', label: 'Blog', icon: FileText },
      { path: '/linkedin', label: 'LinkedIn', icon: Linkedin },
      { path: '/instagram', label: 'Instagram', icon: Instagram },
      { path: '/editorial', label: 'Plan & Publish', icon: Calendar },
    ],
  },
  {
    label: 'Knowledge',
    items: [
      { path: '/brand', label: 'Brand Intelligence', icon: BookOpen },
    ],
  },
  {
    label: 'Review',
    items: [
      { path: '/analytics', label: 'Analytics', icon: BarChart3 },
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const allNavItems = navSections.flatMap(s => s.items);

interface AppLayoutProps {
  children: React.ReactNode;
  user: User;
  profile: { display_name: string; avatar_url: string } | null;
  roles: AppRole[];
  onSignOut: () => void;
  isAdmin: boolean;
  isEditor: boolean;
}

export default function AppLayout({ children, user, profile, onSignOut }: AppLayoutProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = profile?.display_name || user.email || 'User';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="p-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">S</span>
            </div>
            <div>
              <span className="font-display font-bold text-base text-sidebar-primary-foreground block leading-tight">Spiral Up</span>
              <span className="text-[10px] text-sidebar-foreground/60 leading-none">AI Content OS</span>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-6 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 px-3 mb-2">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'border-l-[3px] border-primary text-sidebar-primary bg-transparent pl-[9px]'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 mx-3 mb-3 rounded-lg bg-sidebar-accent">
          <p className="text-sm font-semibold text-sidebar-accent-foreground truncate">{displayName}</p>
          <p className="text-[10px] text-sidebar-foreground truncate">{user.email}</p>
          <Button variant="ghost" size="sm" onClick={onSignOut} className="w-full mt-2 text-xs gap-1.5 h-7">
            <LogOut className="w-3 h-3" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-xs">S</span>
            </div>
            <div>
              <span className="font-display font-bold text-sm block leading-tight">Spiral Up</span>
              <span className="text-[9px] text-muted-foreground leading-none">AI Content OS</span>
            </div>
          </Link>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-md hover:bg-muted">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-card border-b border-border overflow-hidden"
            >
              <nav className="p-3 space-y-1">
                {allNavItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active ? 'border-l-[3px] border-primary text-primary pl-[9px]' : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                      <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
                    </Link>
                  );
                })}
              </nav>
              <div className="px-4 pb-3 border-t border-border pt-3">
                <p className="text-xs font-medium truncate">{displayName}</p>
                <Button variant="ghost" size="sm" onClick={onSignOut} className="w-full mt-1 text-xs gap-1.5 h-7">
                  <LogOut className="w-3 h-3" /> Sign Out
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
