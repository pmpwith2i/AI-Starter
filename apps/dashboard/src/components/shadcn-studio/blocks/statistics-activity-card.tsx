import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Area, AreaChart, XAxis } from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { cn } from "@/lib/utils";

// Weekly wellness chart data
const salesGrowthChartData = [
  { day: "Lun", sales: 260 },
  { day: "Mar", sales: 380 },
  { day: "Mer", sales: 250 },
  { day: "Gio", sales: 580 },
  { day: "Ven", sales: 370 },
  { day: "Sab", sales: 420 },
  { day: "Dom", sales: 300 },
];

const salesGrowthChartConfig = {
  sales: {
    label: "Benessere",
  },
} satisfies ChartConfig;

const StatisticsCardData = {
  title: "Attività",
  amount: "82%",
  changePercentage: 38,
  children: (
    <>
      <ChartContainer config={salesGrowthChartConfig} className="h-36 w-full">
        <AreaChart
          data={salesGrowthChartData}
          margin={{
            left: 12,
            right: 12,
          }}
          className="stroke-2"
        >
          <defs>
            <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="10%" stopColor="var(--primary)" stopOpacity={0.5} />
              <stop offset="90%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tickLine={false}
            tickMargin={5.5}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 2)}
            className="text-muted-foreground text-sm uppercase"
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Area
            dataKey="sales"
            type="natural"
            fill="url(#fillSales)"
            stroke="var(--primary)"
            stackId="a"
          />
        </AreaChart>
      </ChartContainer>
    </>
  ),
};

const StatisticsActivityCard = ({ className }: { className?: string }) => {
  return (
    <Card className={cn("gap-4", className)}>
      <div className="flex items-center justify-between gap-2 px-6">
        <span className="font-medium">{StatisticsCardData.title}</span>
        <span className="text-muted-foreground text-sm">
          Report settimanale
        </span>
      </div>
      <CardContent className="flex justify-between gap-6 max-sm:flex-col">
        <div className="flex flex-col gap-2 self-end">
          <span className="text-5xl font-semibold">
            {StatisticsCardData.amount}
          </span>
          <div className="text-primary flex items-center gap-1">
            {StatisticsCardData.changePercentage > 0 ? (
              <ArrowUpIcon className="size-4" />
            ) : (
              <ArrowDownIcon className="size-4" />
            )}
            <span className="text-xs">
              {StatisticsCardData.changePercentage}%
            </span>
          </div>
        </div>
        <div className="grow sm:pl-6">{StatisticsCardData.children}</div>
      </CardContent>
    </Card>
  );
};

export default StatisticsActivityCard;
