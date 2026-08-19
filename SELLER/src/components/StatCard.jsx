import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend }) => {
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {trend && (
          <p className={`text-xs mt-2 font-medium ${trend.isPositive ? 'text-green-600' : 'text-slate-500'}`}>
            {trend.isPositive ? '↑' : ''} {trend.value}
          </p>
        )}
      </div>
      <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
        <Icon size={24} />
      </div>
    </div>
  );
};

export default StatCard;
