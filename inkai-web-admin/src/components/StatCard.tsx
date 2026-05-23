import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  children?: React.ReactNode;
}

export default function StatCard({ label, value, subValue, icon: Icon, trend, children }: StatCardProps) {
  return (
    <div className="glass-card flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="p-3 bg-white/5 rounded-xl text-amber-500">
          <Icon size={24} />
        </div>
        {trend && (
          <span className={`text-xs px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {trend === 'up' ? '↑ 12%' : '↓ 3%'}
          </span>
        )}
      </div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <h3 className="text-3xl font-bold mt-1">{value}</h3>
        {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
      </div>
      {children}
    </div>
  );
}
