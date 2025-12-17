import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  style?: React.CSSProperties;
  iconColor?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  className,
  style,
  iconColor = 'text-foreground/70',
}: StatsCardProps) {
  return (
    <div className={cn('stat-card', className)} style={style}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-secondary rounded-lg">
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        {trend && trendValue && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              trend === 'up' && 'bg-success/20 text-success',
              trend === 'down' && 'bg-destructive/20 text-destructive',
              trend === 'neutral' && 'bg-muted text-muted-foreground'
            )}
          >
            {trend === 'up' && '↑'} {trend === 'down' && '↓'} {trendValue}
          </span>
        )}
      </div>
      <p className="text-muted-foreground text-sm mb-1">{title}</p>
      <p className="text-2xl lg:text-3xl font-display font-bold text-foreground">{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
      )}
    </div>
  );
}
