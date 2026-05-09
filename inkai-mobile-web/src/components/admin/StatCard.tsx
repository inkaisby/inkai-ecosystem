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
      className={`glass-card p-4 flex flex-col gap-3 relative overflow-hidden group ${onClick ? 'cursor-pointer active:scale-95 transition-all' : ''}`}
      onClick={onClick}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${selectedColor.split(' ')[0]} blur-3xl opacity-20 -mr-10 -mt-10 group-hover:opacity-40 transition-opacity`} />
      
      <div className="flex justify-between items-start relative z-10">
        <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${selectedColor.split(' ')[1]}`}>
          <Icon size={18} />
        </div>
        {trend && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black tracking-tight ${trend === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {trend === 'up' ? '↑ 12%' : '↓ 3%'}
          </span>
        )}
      </div>
      
      <div className="relative z-10">
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.15em] truncate">{label}</p>
        <h3 className="text-2xl font-black text-white leading-none mt-2 tracking-tight">{value}</h3>
        {subValue && (
          <p className="text-[10px] text-gray-600 mt-2 font-bold truncate">
            {subValue}
          </p>
        )}
      </div>
    </motion.div>
  );
}


