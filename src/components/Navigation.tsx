import { type Page } from '@/types/app';
import { LayoutDashboard, Scale, Dumbbell, Apple, Settings, Heart } from 'lucide-react';

interface SidebarProps {
  current: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { page: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'weight', label: 'Weight', icon: Scale },
  { page: 'workouts', label: 'Workouts', icon: Dumbbell },
  { page: 'nutrition', label: 'Nutrition', icon: Apple },
  { page: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ current, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-60 bg-green-800 text-white min-h-screen fixed left-0 top-0">
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-green-700/50">
        <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center">
          <Heart size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold leading-tight">FitTrack</h1>
          <p className="text-xs text-green-300">Personal Fitness</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = current === item.page;
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'text-green-100 hover:bg-green-700/60'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-green-700/50">
        <p className="text-xs text-green-300">MVP Version 1.0</p>
      </div>
    </aside>
  );
}

interface MobileNavProps {
  current: Page;
  onNavigate: (page: Page) => void;
}

export function MobileNav({ current, onNavigate }: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-green-800 text-white z-40 flex items-center justify-around px-2 py-2 shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = current === item.page;
        return (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
              isActive ? 'text-green-300' : 'text-green-100'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
