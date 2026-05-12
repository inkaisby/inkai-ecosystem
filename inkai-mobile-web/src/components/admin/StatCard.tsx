import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  onClick?: () => void;
  color?: string;
}

export default function StatCard({ label, value, subValue, icon: Icon, trend, onClick, color = 'amber' }: StatCardProps) {
  const colorMap: any = {
    amber: 'from-amber-500/20 text-amber-500 border-amber-500/10',
    blue: 'from-blue-500/20 text-blue-500 border-blue-500/10',
    green: 'from-green-500/20 text-green-500 border-green-500/10',
    red: 'from-red-500/20 text-red-500 border-red-500/10',
  };

  const selectedColor = colorMap[color] || colorMap.amber;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`glass-card p-5 flex flex-col gap-4 relative overflow-hidden group ${onClick ? 'cursor-pointer active:scale-95 transition-all' : ''}`}
      onClick={onClick}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${selectedColor.split(' ')[0]} blur-3xl opacity-10 -mr-12 -mt-12 group-hover:opacity-20 transition-opacity`} />
      
      <div className="flex justify-between items-start relative z-10">
        <div className={`p-2 rounded-xl bg-white/5 border border-white/10 ${selectedColor.split(' ')[1]}`}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
        {trend && (
          <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black tracking-tight ${trend === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {trend === 'up' ? '↑ 12%' : '↓ 3%'}
          </span>
        )}
      </div>
      
      <div className="relative z-10">
        <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.2em] truncate">{label}</p>
        <h3 className="text-3xl font-black text-white leading-none mt-2.5 tracking-tighter">{value}</h3>
        {subValue && (
          <p className="text-[10px] text-gray-600 mt-3 font-bold truncate uppercase tracking-wide">
            {subValue}
          </p>
        )}
      </div>
    </motion.div>
  );
}


