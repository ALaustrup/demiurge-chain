'use client';

import { useRef, useEffect, useState } from 'react';
import type { ChartDataPoint } from '@/lib/explorer-types';

// ============ Interactive Line Chart ============
export function LineChart({ 
  data, 
  color = '#00FFFF', 
  height = 200,
  showGrid = true,
  showTooltip = true,
  label = 'Value',
  unit = '',
  animated = true,
}: { 
  data: ChartDataPoint[]; 
  color?: string; 
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  label?: string;
  unit?: string;
  animated?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; timestamp: number } | null>(null);
  const [animationProgress, setAnimationProgress] = useState(animated ? 0 : 1);

  useEffect(() => {
    if (!animated) return;
    let start: number | null = null;
    const duration = 800;
    
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setAnimationProgress(progress);
      if (progress < 1) requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, [data, animated]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const chartHeight = rect.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartInnerHeight = chartHeight - padding.top - padding.bottom;

    // Clear
    ctx.clearRect(0, 0, width, chartHeight);

    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      
      // Horizontal lines
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartInnerHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
      }
    }

    // Draw Y-axis labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = max - (range / 4) * i;
      const y = padding.top + (chartInnerHeight / 4) * i;
      ctx.fillText(value.toFixed(1) + unit, padding.left - 8, y + 3);
    }

    // Draw line
    const visiblePoints = Math.floor(data.length * animationProgress);
    if (visiblePoints < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let i = 0; i < visiblePoints; i++) {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      const y = padding.top + (1 - (data[i].value - min) / range) * chartInnerHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, chartHeight - padding.bottom);
    gradient.addColorStop(0, color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
    gradient.addColorStop(1, color.replace(')', ', 0)').replace('rgb', 'rgba'));
    
    ctx.beginPath();
    ctx.moveTo(padding.left, chartHeight - padding.bottom);
    for (let i = 0; i < visiblePoints; i++) {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      const y = padding.top + (1 - (data[i].value - min) / range) * chartInnerHeight;
      ctx.lineTo(x, y);
    }
    const lastX = padding.left + ((visiblePoints - 1) / (data.length - 1)) * chartWidth;
    ctx.lineTo(lastX, chartHeight - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw dots at data points
    for (let i = 0; i < visiblePoints; i++) {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      const y = padding.top + (1 - (data[i].value - min) / range) * chartInnerHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }, [data, color, showGrid, animationProgress]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showTooltip || !data || data.length < 2) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = { left: 50, right: 20 };
    const chartWidth = rect.width - padding.left - padding.right;
    
    const index = Math.round(((x - padding.left) / chartWidth) * (data.length - 1));
    if (index >= 0 && index < data.length) {
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        value: data[index].value,
        timestamp: data[index].timestamp,
      });
    }
  };

  return (
    <div className="relative" style={{ height }}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      />
      {tooltip && (
        <div 
          className="absolute glass-panel rounded px-2 py-1 text-xs pointer-events-none z-10"
          style={{ left: tooltip.x + 10, top: tooltip.y - 30 }}
        >
          <p className="text-white font-semibold">{tooltip.value.toFixed(2)}{unit}</p>
          <p className="text-gray-400">{new Date(tooltip.timestamp).toLocaleTimeString()}</p>
        </div>
      )}
    </div>
  );
}

// ============ Bar Chart ============
export function BarChart({ 
  data, 
  color = '#00FFFF', 
  height = 200,
  barWidth = 20,
  gap = 4,
}: { 
  data: ChartDataPoint[]; 
  color?: string;
  height?: number;
  barWidth?: number;
  gap?: number;
}) {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-gray-500 text-xs">No data</div>;
  }

  const values = data.map(d => d.value);
  const max = Math.max(...values);

  return (
    <div className="relative overflow-x-auto" style={{ height }}>
      <div className="flex items-end h-full gap-1 px-4 pb-6">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1" style={{ width: barWidth }}>
            <div 
              className="rounded-t transition-all duration-500 ease-out"
              style={{ 
                width: barWidth,
                height: `${(d.value / max) * (height - 40)}px`,
                backgroundColor: color,
                opacity: 0.8,
              }}
            />
            <span className="text-gray-500 text-[10px] -rotate-45 origin-top-left whitespace-nowrap">
              {new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Pie Chart ============
export function PieChart({ 
  data, 
  colors = ['#00FFFF', '#00FF88', '#9B59B6', '#FF69B4', '#FFC107'],
  size = 200,
  showLabels = true,
}: { 
  data: { label: string; value: number }[]; 
  colors?: string[];
  size?: number;
  showLabels?: boolean;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = -Math.PI / 2;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((d, i) => {
          const angle = (d.value / total) * Math.PI * 2;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          currentAngle = endAngle;

          const cx = size / 2;
          const cy = size / 2;
          const r = size / 2 - 10;
          
          const x1 = cx + r * Math.cos(startAngle);
          const y1 = cy + r * Math.sin(startAngle);
          const x2 = cx + r * Math.cos(endAngle);
          const y2 = cy + r * Math.sin(endAngle);
          
          const largeArc = angle > Math.PI ? 1 : 0;

          return (
            <path
              key={i}
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={colors[i % colors.length]}
              className="transition-opacity hover:opacity-80 cursor-pointer"
            />
          );
        })}
        {/* Center hole for donut effect */}
        <circle cx={size / 2} cy={size / 2} r={size / 4} fill="#0a0a0f" />
      </svg>
      {showLabels && (
        <div className="space-y-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              <span className="text-gray-400 text-sm">{d.label}</span>
              <span className="text-white text-sm">{((d.value / total) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Area Chart (Stacked) ============
export function AreaChart({
  datasets,
  height = 200,
  showLegend = true,
}: {
  datasets: Array<{
    label: string;
    data: ChartDataPoint[];
    color: string;
  }>;
  height?: number;
  showLegend?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !datasets || datasets.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const chartHeight = rect.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartInnerHeight = chartHeight - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, chartHeight);

    // Find global max
    const allValues = datasets.flatMap(ds => ds.data.map(d => d.value));
    const max = Math.max(...allValues);

    // Draw each dataset as stacked area
    datasets.forEach((dataset, datasetIndex) => {
      const { data, color } = dataset;
      if (data.length < 2) return;

      const gradient = ctx.createLinearGradient(0, padding.top, 0, chartHeight - padding.bottom);
      gradient.addColorStop(0, color + '40');
      gradient.addColorStop(1, color + '00');

      ctx.beginPath();
      ctx.moveTo(padding.left, chartHeight - padding.bottom);
      
      data.forEach((d, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartWidth;
        const y = padding.top + (1 - d.value / max) * chartInnerHeight;
        if (i === 0) {
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.lineTo(padding.left + chartWidth, chartHeight - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw line
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      data.forEach((d, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartWidth;
        const y = padding.top + (1 - d.value / max) * chartInnerHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  }, [datasets]);

  return (
    <div>
      <div style={{ height }}>
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      {showLegend && (
        <div className="flex items-center gap-4 mt-4 justify-center">
          {datasets.map((ds, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: ds.color }} />
              <span className="text-gray-400 text-sm">{ds.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Real-time Gauge ============
export function Gauge({
  value,
  max,
  label,
  color = '#00FFFF',
  size = 150,
}: {
  value: number;
  max: number;
  label: string;
  color?: string;
  size?: number;
}) {
  const percentage = Math.min(100, (value / max) * 100);
  const angle = (percentage / 100) * 180;
  const radius = size / 2 - 10;
  
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Background arc */}
        <path
          d={describeArc(size / 2, size / 2, radius, 180, 360)}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={describeArc(size / 2, size / 2, radius, 180, 180 + angle)}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          style={{ transition: 'all 0.5s ease-out' }}
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          fill="white"
          fontSize="20"
          fontWeight="bold"
        >
          {percentage.toFixed(0)}%
        </text>
      </svg>
      <p className="text-gray-400 text-sm mt-1">{label}</p>
    </div>
  );
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

// ============ Live Counter ============
export function LiveCounter({
  value,
  label,
  prefix = '',
  suffix = '',
  color = 'cyan',
}: {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  color?: 'cyan' | 'green' | 'purple' | 'pink' | 'yellow';
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = (value - displayValue) / steps;
    let current = displayValue;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      setDisplayValue(current);
      if (step >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const colorClasses = {
    cyan: 'text-neon-cyan',
    green: 'text-neon-green',
    purple: 'text-neon-purple',
    pink: 'text-neon-pink',
    yellow: 'text-yellow-400',
  };

  return (
    <div className="text-center">
      <p className={`text-3xl font-grunge ${colorClasses[color]}`}>
        {prefix}{Math.floor(displayValue).toLocaleString()}{suffix}
      </p>
      <p className="text-gray-400 text-sm mt-1">{label}</p>
    </div>
  );
}
