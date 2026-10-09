import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export function Card({ children, className = '', title, subtitle, action }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-green-100 shadow-sm ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-green-50">
          <div>
            {title && <h3 className="text-sm font-semibold text-gray-800">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={title ? 'p-5' : 'p-5'}>{children}</div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  trend?: string;
  trendColor?: 'green' | 'red' | 'neutral';
}

export function StatCard({ label, value, unit, icon, trend, trendColor = 'neutral' }: StatCardProps) {
  const trendColors = {
    green: 'text-green-600',
    red: 'text-red-500',
    neutral: 'text-gray-500',
  };

  return (
    <div className="bg-white rounded-xl border border-green-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {value}
            {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
          </p>
          {trend && <p className={`text-xs mt-1 ${trendColors[trendColor]}`}>{trend}</p>}
        </div>
        {icon && <div className="text-green-600">{icon}</div>}
      </div>
    </div>
  );
}
