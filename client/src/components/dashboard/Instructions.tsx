import React from 'react';
import { BookOpen, Code, Upload, Eye } from 'lucide-react';

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
}

const Instructions: React.FC = () => {
  const steps: Step[] = [
    {
      icon: Code,
      title: '1. Install Extension',
      description: 'Copy the VS Code extension to your extensions folder or run in development mode.',
      gradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      iconBg: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: Upload,
      title: '2. Sync Project',
      description: 'Right-click your src folder in VS Code and select "Sync Project to Backend".',
      gradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      iconBg: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      icon: Eye,
      title: '3. View & Search',
      description: 'Browse and search your synced files in this web interface.',
      gradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      iconBg: 'bg-purple-100 dark:bg-purple-900',
      iconColor: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="glass-card rounded-2xl p-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <BookOpen className="h-5 w-5 mr-2 text-primary-500" />
        How to Use
      </h3>
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl bg-gradient-to-br ${step.gradient}`}
          >
            <div className={`w-12 h-12 ${step.iconBg} rounded-lg flex items-center justify-center mb-3`}>
              <step.icon className={`h-6 w-6 ${step.iconColor}`} />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              {step.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Instructions;