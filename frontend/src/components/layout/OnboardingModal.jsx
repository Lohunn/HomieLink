import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  Compass, Sparkles, CheckCircle2, ArrowRight, MessageSquare,
  FolderKanban, Lightbulb, Users, CheckSquare, X, Play, BookOpen
} from 'lucide-react';

export default function OnboardingModal({ isOpen, onClose }) {
  const {
    activeWorkspace, channels, selectChannel, setActiveSection,
    members, projects
  } = useWorkspace();

  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to HomieLink",
      subtitle: "Your space. Your people. Your conversations.",
      badge: "Get Started",
      description: "HomieLink is designed around one seamless loop: Connect → Brainstorm → Plan → Create → Complete. Everything starts from conversation and flows straight into real teamwork.",
      icon: Compass,
      color: "from-brand-primary to-indigo-600",
      actionLabel: "Start Tour",
      onAction: () => setCurrentStep(1)
    },
    {
      title: "1. Connect in Channels & DMs",
      subtitle: "Topic-based communication with real-time presence",
      badge: "Connect",
      description: "Chat in topic channels like #general and #software, or start instant 1-on-1 direct messages. Live typing indicators and reactions keep everyone in sync.",
      icon: MessageSquare,
      color: "from-sky-500 to-indigo-600",
      actionLabel: "Next: Conversation-to-Action",
      shortcut: {
        label: "Jump to #general",
        run: () => {
          if (channels.length > 0) selectChannel(channels[0]);
          onClose();
        }
      },
      onAction: () => setCurrentStep(2)
    },
    {
      title: "2. Conversation-to-Action (Signature Feature)",
      subtitle: "Turn words into actionable work with 1 click",
      badge: "Signature Feature",
      description: "Hover over any chat message to reveal 'Convert to Task'. It automatically prefills details, assigns teammates, sets deadlines, and leaves a 2-way backlink between the chat and the Kanban board.",
      icon: Sparkles,
      color: "from-brand-primary to-purple-600",
      actionLabel: "Next: Projects & Kanban",
      onAction: () => setCurrentStep(3)
    },
    {
      title: "3. Plan & Complete on Kanban",
      subtitle: "Track work across 5 agile columns",
      badge: "Plan & Execute",
      description: "Organize tasks into Backlog, To Do, In Progress, Review, and Done. Tasks converted from chat carry a 'From Chat' badge linking straight back to original discussions.",
      icon: FolderKanban,
      color: "from-amber-500 to-brand-primary",
      actionLabel: "Next: Brainstorming & Polls",
      shortcut: {
        label: "Open Kanban Board",
        run: () => {
          setActiveSection('projects');
          onClose();
        }
      },
      onAction: () => setCurrentStep(4)
    },
    {
      title: "4. Brainstorm Ideas & Run Polls",
      subtitle: "Decide swiftly without switching apps",
      badge: "Brainstorm",
      description: "Capture spontaneous concepts on the Idea Board with upvotes, or spin up quick polls with live vote percentages to build consensus in seconds.",
      icon: Lightbulb,
      color: "from-amber-400 to-rose-500",
      actionLabel: "Explore Workspace Overview",
      shortcut: {
        label: "Open Ideas & Polls",
        run: () => {
          setActiveSection('ideas');
          onClose();
        }
      },
      onAction: () => {
        setActiveSection('overview');
        onClose();
      }
    }
  ];

  const step = steps[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="fixed inset-0 z-50 bg-bg-main/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-bg-sidebar border border-border-subtle rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header bar */}
        <div className="p-4 px-6 border-b border-border-subtle flex items-center justify-between bg-bg-surface/50">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-brand-primary/20 text-brand-primary flex items-center justify-center">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary">
                {step.badge}
              </span>
              <h3 className="text-xs font-bold text-text-primary">
                Workspace Tour & Onboarding
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            title="Close onboarding"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-5">
          {/* Hero illustration */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-bg-surface border border-border-subtle">
            <div className={`h-14 w-14 rounded-2xl bg-gradient-to-tr ${step.color} flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand-primary/20`}>
              <StepIcon className="h-7 w-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                {step.title}
              </h4>
              <p className="text-xs text-brand-secondary font-medium mt-0.5">
                {step.subtitle}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-text-secondary leading-relaxed bg-bg-surface/40 p-4 rounded-lg border border-border-subtle">
            {step.description}
          </p>

          {/* Shortcuts if available */}
          {step.shortcut && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-xs">
              <span className="text-text-muted text-[11px]">Quick Action:</span>
              <button
                onClick={step.shortcut.run}
                className="text-brand-primary hover:underline font-semibold flex items-center gap-1"
              >
                {step.shortcut.label}
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {steps.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentStep === idx
                    ? 'w-6 bg-brand-primary'
                    : 'w-2 bg-border-subtle hover:bg-text-muted'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer controls */}
        <div className="p-4 px-6 border-t border-border-subtle bg-bg-surface/30 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setActiveSection('overview');
              onClose();
            }}
            className="text-xs text-text-muted hover:text-text-primary transition-colors flex items-center gap-1 font-medium"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Open Overview</span>
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary rounded-md hover:bg-bg-hover transition-colors"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={step.onAction}
              className="px-4 py-1.5 bg-brand-primary hover:bg-brand-hover text-white rounded-md text-xs font-semibold shadow-md shadow-brand-primary/20 transition-all flex items-center gap-1.5"
            >
              <span>{step.actionLabel}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
