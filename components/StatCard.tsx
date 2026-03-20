import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subText?: string;
  icon: React.ReactNode;
  color: string; // e.g. "text-indigo-400"
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subText,
  icon,
  color,
}) => (
  <div className="bg-[#1e293b]/40 border border-slate-800 p-6 rounded-[2rem] group hover:bg-slate-800/40 transition-all shadow-lg">
    <div
      className={`p-3 bg-slate-900/80 w-fit rounded-2xl border border-slate-800 mb-6 ${color} group-hover:scale-110 transition-transform shadow-inner`}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 22 })}
    </div>
    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">
      {title}
    </p>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-black text-white leading-none">
        {value}
      </span>
      {subText && (
        <span className="text-[9px] font-bold text-slate-500 tracking-tighter">
          {subText}
        </span>
      )}
    </div>
  </div>
);
