'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { PatientGrowthPoint } from '@/features/dashboard/types/dashboard.type';

type Props = {
  data: PatientGrowthPoint[];
  isLoading?: boolean;
};

function formatAxisDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function GrowthTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: PatientGrowthPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length || !label) {
    return null;
  }

  const point = payload[0]?.payload;
  if (!point) {
    return null;
  }

  return (
    <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{formatAxisDate(label)}</p>
      <p className="text-muted-foreground mt-1">
        Total patients: {point.cumulative}
      </p>
      <p className="text-muted-foreground">New: {point.newPatients}</p>
    </div>
  );
}

export function PatientGrowthChart({ data, isLoading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Patient growth</CardTitle>
        <p className="text-muted-foreground text-sm">
          Cumulative patients over the last 30 days
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid
                  stroke="currentColor"
                  className="text-border"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatAxisDate}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                  className="text-muted-foreground text-xs"
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  className="text-muted-foreground text-xs"
                />
                <Tooltip content={<GrowthTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="currentColor"
                  fill="currentColor"
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
