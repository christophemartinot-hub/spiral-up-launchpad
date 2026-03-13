import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Sparkles, FileText, PenTool, Calendar, ClipboardList,
  BarChart3, FolderOpen, Settings, Menu, X, ChevronRight, Brain, Rocket,
  TrendingUp, Mail, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navSections = [
  {
    label: 'Intelligence',
    items: [
      { path: '/', label: 'Command Center', icon: LayoutDashboard },
      { path: '/brand', label: 'Brand Intelligence', icon: Brain },
      { path: '/performance', label: 'Performance', icon: TrendingUp },
      { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Create',
    items: [
      { path: '/studio', label: 'Content Studio', icon: Sparkles },
      { path: '/blog', label: 'Blog Workflow', icon: PenTool },
      { path: '/content', label: 'Content Library', icon: FolderOpen },
    ],
  },
  {
    label: 'Plan',
    items: [
      { path: '/editorial', label: 'Editorial Planning', icon: ClipboardList },
      { path: '/campaigns/new', label: 'Campaign Planner', icon: Rocket },
      { path: '/calendar', label: 'Calendar', icon: Calendar },
    ],
  },
  {
    label: 'Distribute',
    items: [
      { path: '/email', label: 'Email Distribution', icon: Mail },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const allItems = navSections.flatMap(s => s.items);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="p-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">S</span>
            </div>
            <div>
              <span className="font-display font-bold text-base text-sidebar-primary-foreground block leading-tight">Spiral Up</span>
              <span className="text-[10px] text-sidebar-foreground/60 leading-none">AI Marketing Engine</span>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-5 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 px-3 mb-1.5">
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
                          ? 'bg-sidebar-accent text-sidebar-primary'
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
        <div className="p-4 mx-3 mb-4 rounded-lg bg-sidebar-accent">
          <p className="text-xs text-sidebar-foreground font-medium mb-0.5">Consultant Mode</p>
          <p className="text-sm font-semibold text-sidebar-accent-foreground">Christophe Martinot</p>
          <p className="text-[10px] text-sidebar-foreground">Review · Edit · Approve</p>
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
              <span className="text-[9px] text-muted-foreground leading-none">AI Marketing Engine</span>
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
                {allItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                      <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
                    </Link>
                  );
                })}
              </nav>
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
