import React, { useMemo } from "react";
import { Job } from "../../types";
import { DateFilter } from "../../hooks/useJobFilters";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell 
} from "recharts";
import { 
  MapPin, AlertTriangle, 
  Calendar, CheckCircle2, TrendingUp, UserMinus, Camera, Map, Building
} from "lucide-react";
import { motion } from "motion/react";
import { LOCATION_PALETTE, TYPE_PALETTE, shortenLocation, categorizeLocation, getJobLocationStr, getJobDeadlineStr } from "../../utils/jobUtils";
import { STATUS } from "../../constants/fieldNames";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { useTheme } from "../../context/ThemeContext";

interface DashboardStatsProps {
  jobs: Job[];
  todayEventsCount: number;
  onNavigateToBrowse?: (filter: DateFilter) => void;
}

export const LOCATION_COLORS = LOCATION_PALETTE;
export const TYPE_COLORS = TYPE_PALETTE;

export const CustomTooltip = ({ active, payload, label }: any) => {
  const { theme } = useTheme();
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const name = label || data.name || "Ukjent";
    const value = payload[0].value;
    
    return (
      <div className="p-3 border rounded-lg shadow-xl pointer-events-none z-50 bg-stone-50 border-stone-200 text-stone-900">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-stone-400">{name}</p>
        <p className="text-xs font-bold">{value} oppdrag</p>
      </div>
    );
  }
  return null;
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  valueColor?: string;
  textColor?: string;
  onClick?: () => void;
  subValue?: string | React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, valueColor, textColor = "text-stone-900", onClick, subValue }) => {
  const { theme } = useTheme();
  return (
    <Card 
      whileHover={onClick ? { y: -4 } : undefined}
      className={`
        ${color} 
        flex flex-col gap-4 
        ${onClick ? 'cursor-pointer' : ''} 
      `}
      padding="sm"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          {icon}
        </div>
        <Badge variant="outline">Status</Badge>
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <p 
            className="text-3xl font-serif font-black"
            style={valueColor ? { color: valueColor } : { color: 'var(--stone-900)' }}
          >
            {value}
          </p>
          {subValue && (
            <span className="text-sm font-medium text-stone-500">{subValue}</span>
          )}
        </div>
        <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${textColor}`}>{label}</p>
      </div>
    </Card>
  );
};

export const DashboardStats: React.FC<DashboardStatsProps> = ({ jobs, todayEventsCount, onNavigateToBrowse }) => {
  const { theme } = useTheme();
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const locationStats: Record<string, number> = {};
    let criticalOverdueCount = 0;
    let overdueCount = 0;
    let withinDeadlineCount = 0;
    let unassignedCount = 0;
    
    let studioCount = 0;
    let locationCount = 0;
    let frontOfHouseCount = 0;

    if (Array.isArray(jobs)) {
      jobs.forEach(job => {
        const props = job.all_properties || {};
        
        // Unassigned
        if (!job.owner_names || job.owner_names.length === 0 || job.owner_names.includes(STATUS.UNASSIGNED)) {
          unassignedCount++;
        }

        // Location
        const locStr = getJobLocationStr(props);
        const loc = shortenLocation(locStr);
        locationStats[loc] = (locationStats[loc] || 0) + 1;

        const cat = categorizeLocation(locStr);
        if (cat === 'foh') frontOfHouseCount++;
        else if (cat === 'location') locationCount++;
        else if (cat === 'studio') studioCount++;

        // Deadline & Overdue
        const deadlineStr = getJobDeadlineStr(props, job);
        if (deadlineStr) {
          const deadline = new Date(deadlineStr);
          deadline.setHours(0, 0, 0, 0);
          
          const diffInTime = deadline.getTime() - today.getTime();
          const diffInDays = Math.round(diffInTime / (1000 * 3600 * 24));

          if (diffInDays < -100) {
            criticalOverdueCount++;
          } else if (diffInDays < 0) {
            overdueCount++;
          } else {
            withinDeadlineCount++;
          }
        } else {
          withinDeadlineCount++; // No deadline = within? Or unknown? Let's assume within for now.
        }
      });
    }

    const locationData = Object.entries(locationStats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      totalOrders: jobs.length,
      unassignedCount,
      studioCount,
      locationCount,
      frontOfHouseCount,
      locationData,
      criticalOverdueCount,
      overdueCount,
      withinDeadlineCount
    };
  }, [jobs]);

  const { totalOrders, unassignedCount, studioCount, locationCount, frontOfHouseCount, locationData, criticalOverdueCount, overdueCount, withinDeadlineCount } = stats;

  return (
    <div className="space-y-10">
      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<TrendingUp className="w-5 h-5 text-stone-900" />}
          label="Totalt antall ordre"
          value={totalOrders}
          subValue={unassignedCount > 0 ? <span className="text-red-600">({unassignedCount} Ikke Fordelt)</span> : undefined}
          color="bg-stone-50"
          onClick={() => onNavigateToBrowse?.('all')}
        />
        <StatCard 
          icon={<AlertTriangle className="w-5 h-5 text-stone-900" />}
          label="Kritisk over frist"
          value={criticalOverdueCount}
          valueColor={theme.statusCritical}
          color="bg-stone-100"
          textColor="text-stone-900"
          onClick={() => onNavigateToBrowse?.('overdue')}
        />
        <StatCard 
          icon={<AlertTriangle className="w-5 h-5 text-stone-900" />}
          label="Over fristen"
          value={overdueCount}
          valueColor={theme.statusOverdue}
          color="bg-stone-200"
          textColor="text-stone-900"
          onClick={() => onNavigateToBrowse?.('overdue')}
        />
        <StatCard 
          icon={<CheckCircle2 className="w-5 h-5 text-stone-900" />}
          label="Innen fristen"
          value={withinDeadlineCount}
          valueColor={theme.statusWithin}
          color="bg-stone-100"
          textColor="text-stone-900"
          onClick={() => onNavigateToBrowse?.('all')}
        />
      </div>
    </div>
  );
};
