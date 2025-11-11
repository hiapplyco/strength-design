
import React from 'react';
import { colors } from '@/lib/design-tokens';

interface MacroDonutChartProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  size?: number;
}

export const MacroDonutChart = ({ 
  calories, 
  protein, 
  carbs, 
  fat, 
  size = 150 
}: MacroDonutChartProps) => {
  const proteinCalories = protein * 4;
  const carbCalories = carbs * 4;
  const fatCalories = fat * 9;
  const totalMacroCalories = proteinCalories + carbCalories + fatCalories;

  const proteinPercentage = totalMacroCalories > 0 ? (proteinCalories / totalMacroCalories) * 100 : 0;
  const carbPercentage = totalMacroCalories > 0 ? (carbCalories / totalMacroCalories) * 100 : 0;
  const fatPercentage = totalMacroCalories > 0 ? (fatCalories / totalMacroCalories) * 100 : 0;

  const strokeWidth = 8;
  const radius = (size / 2) - (strokeWidth / 2);
  const circumference = 2 * Math.PI * radius;

  const proteinStroke = (proteinPercentage / 100) * circumference;
  const carbStroke = (carbPercentage / 100) * circumference;
  const fatStroke = (fatPercentage / 100) * circumference;

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Protein */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.hex.chartGreen}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${proteinStroke} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
        />
        
        {/* Carbs */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.hex.chartBlue}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${carbStroke} ${circumference}`}
          strokeDashoffset={-proteinStroke}
          strokeLinecap="round"
        />
        
        {/* Fat */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.hex.chartRed}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${fatStroke} ${circumference}`}
          strokeDashoffset={-(proteinStroke + carbStroke)}
          strokeLinecap="round"
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold">{Math.round(calories)}</div>
        <div className="text-sm text-muted-foreground">kcal</div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Protein {proteinPercentage.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Carbs {carbPercentage.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Fat {fatPercentage.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};
