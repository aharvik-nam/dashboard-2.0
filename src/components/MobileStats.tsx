import React from "react";
import { Job } from "../types";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts";
import { MapPin, Camera } from "lucide-react";
import { TYPE_COLORS, LOCATION_COLORS, CustomTooltip } from "./dashboard/DashboardStats";
import { Card } from "./ui/Card";
import { useTheme } from "../context/ThemeContext";
import { shortenLocation } from "../utils/jobUtils";

interface MobileStatsProps {
  jobs: Job[];
}

export const MobileStats: React.FC<MobileStatsProps> = ({ jobs }) => {
  const [activeChart, setActiveChart] = React.useState<'location' | 'type'>('location');
  
  const stats = React.useMemo(() => {
    const locationStats: Record<string, number> = {};
    const typeStats: Record<string, number> = {};

    if (Array.isArray(jobs)) {
      jobs.forEach(job => {
        const props = job.all_properties || {};
        const loc = shortenLocation(props.lokasjon_for_fotografering___ny || props.lokasjon_for_fotografering || "Ukjent");
        locationStats[loc] = (locationStats[loc] || 0) + 1;

        const type = props.type_fotografering || "Ukjent";
        typeStats[type] = (typeStats[type] || 0) + 1;
      });
    }

    const locationData = Object.entries(locationStats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const typeData = Object.entries(typeStats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { locationData, typeData };
  }, [jobs]);

  const { theme } = useTheme();
  const { locationData, typeData } = stats;

  return (
    <div className="md:hidden p-4 border-t space-y-4 bg-stone-50 border-stone-100">
      <div className="flex items-center justify-center p-1 rounded-xl w-full max-w-xs mx-auto bg-stone-200">
        <button
          onClick={() => setActiveChart('location')}
          className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${
            activeChart === 'location' 
              ? 'bg-stone-50 text-stone-900 shadow-sm' 
              : 'text-stone-500'
          }`}
        >
          Lokasjon
        </button>
        <button
          onClick={() => setActiveChart('type')}
          className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${
            activeChart === 'type' 
              ? 'bg-stone-50 text-stone-900 shadow-sm' 
              : 'text-stone-500'
          }`}
        >
          Type
        </button>
      </div>

      <Card padding="sm" className="bg-stone-50">
        {activeChart === 'location' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-stone-400" />
              <h3 className="text-[9px] font-bold uppercase tracking-widest text-stone-900">Lokasjon</h3>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                    tick={{ fontSize: 8, fontWeight: 700, fill: '#78716c' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f5f5f4' }}
                    content={<CustomTooltip />}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                    {locationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={LOCATION_COLORS[index % LOCATION_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="w-3 h-3 text-stone-400" />
              <h3 className="text-[9px] font-bold uppercase tracking-widest text-stone-900">Type</h3>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    layout="horizontal"
                    align="center"
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={6}
                    formatter={(value) => (
                      <span className="text-[8px] font-bold uppercase tracking-tighter text-stone-500">
                        {value.length > 12 ? `${value.substring(0, 12)}...` : value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
