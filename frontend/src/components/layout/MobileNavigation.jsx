import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  MessageSquare, FolderKanban, Lightbulb, Activity, Users, Layers
} from 'lucide-react';

export default function MobileNavigation() {
  const { activeSection, setActiveSection, setMobileView } = useWorkspace();

  const navItems = [
    { id: 'channels', label: 'Chat', icon: MessageSquare },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'ideas', label: 'Ideas', icon: Lightbulb },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'members', label: 'Members', icon: Users },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-14 bg-bg-sidebar border-t border-border-subtle z-40 flex items-center justify-around px-2 pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;

        return (
          <button
            key={item.id}
            onClick={() => {
              setActiveSection(item.id);
              if (item.id === 'channels') {
                setMobileView('list');
              }
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              isActive
                ? 'text-brand-primary font-semibold'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
