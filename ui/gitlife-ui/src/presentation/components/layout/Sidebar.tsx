import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Settings, 
  BarChart3, 
  Moon, 
  Sun, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Edit3,
  GitBranch,
  Home
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../../providers/ThemeProvider';

interface SidebarProps {
  currentView: 'kanban' | 'markdown';
  onViewChange: (view: 'kanban' | 'markdown') => void;
  onSearchOpen: () => void;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  onSearchOpen,
  isMobile = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';

  return (
    <div className={clsx(
      'h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-200',
      isMobile ? 'w-64' : clsx(
        'fixed left-0 top-0 z-10',
        sidebarWidth,
        'lg:block hidden' // Hide on mobile, show on large screens
      )
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <GitBranch className="text-primary-600 dark:text-primary-400" size={24} />
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                GitLife
              </h1>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Search */}
        <div className="p-3">
          <button
            onClick={onSearchOpen}
            className={clsx(
              'flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400',
              isCollapsed && 'justify-center'
            )}
          >
            <Search size={18} />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">Search everything...</span>
                <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded border text-gray-500 dark:text-gray-400">
                  ⌘K
                </kbd>
              </>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pb-3">
          <div className="space-y-1">
            {/* Home */}
            <NavItem
              icon={<Home size={18} />}
              label="Home"
              isActive={false}
              isCollapsed={isCollapsed}
            />

            {/* Reading Section */}
            <div className="pt-4">
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-2">
                  Reading
                </h3>
              )}
              
              <NavItem
                icon={<BookOpen size={18} />}
                label="Reading List"
                isActive={true}
                isCollapsed={isCollapsed}
              />

              {/* View Mode Sub-items */}
              {!isCollapsed && (
                <div className="ml-6 mt-1 space-y-1">
                  <SubNavItem
                    icon={<Eye size={16} />}
                    label="Kanban View"
                    isActive={currentView === 'kanban'}
                    onClick={() => onViewChange('kanban')}
                  />
                  <SubNavItem
                    icon={<Edit3 size={16} />}
                    label="Markdown View"
                    isActive={currentView === 'markdown'}
                    onClick={() => onViewChange('markdown')}
                  />
                </div>
              )}

              <NavItem
                icon={<BarChart3 size={18} />}
                label="Statistics"
                isActive={false}
                isCollapsed={isCollapsed}
              />
            </div>

            {/* Future sections placeholder */}
            {!isCollapsed && (
              <div className="pt-4">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-2">
                  Coming Soon
                </h3>
                <div className="space-y-1 opacity-50">
                  <NavItem
                    icon={<BookOpen size={18} />}
                    label="Notes"
                    isActive={false}
                    isCollapsed={isCollapsed}
                    disabled
                  />
                  <NavItem
                    icon={<BookOpen size={18} />}
                    label="Tasks"
                    isActive={false}
                    isCollapsed={isCollapsed}
                    disabled
                  />
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-1">
          <button
            onClick={toggleTheme}
            className={clsx(
              'flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400',
              isCollapsed && 'justify-center'
            )}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {!isCollapsed && (
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            )}
          </button>

          <NavItem
            icon={<Settings size={18} />}
            label="Settings"
            isActive={false}
            isCollapsed={isCollapsed}
          />
        </div>
      </div>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  isActive,
  isCollapsed,
  disabled = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex items-center gap-3 w-full p-2.5 rounded-lg transition-colors',
        isCollapsed && 'justify-center',
        isActive
          ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span className={clsx(isActive && 'text-primary-600 dark:text-primary-400')}>
        {icon}
      </span>
      {!isCollapsed && (
        <span className="flex-1 text-left font-medium">
          {label}
        </span>
      )}
    </button>
  );
};

interface SubNavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const SubNavItem: React.FC<SubNavItemProps> = ({
  icon,
  label,
  isActive,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 w-full p-2 rounded-md text-sm transition-colors',
        isActive
          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
      )}
    >
      <span className={clsx(isActive && 'text-primary-600 dark:text-primary-400')}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
};