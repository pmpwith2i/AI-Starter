import { HeartPulseIcon, UtensilsCrossedIcon } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";

const StatisticsSalesOverviewCard = ({ className }: { className?: string }) => {
  return (
    <Card className={cn("gap-6", className)}>
      <CardHeader className="flex flex-col gap-1">
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-muted-foreground">Panoramica salute</span>
          <span className="text-sm">+12.4%</span>
        </div>
        <span className="text-2xl font-semibold">92/100</span>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between gap-1">
          <div className="flex flex-1 flex-col gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex size-8 items-center justify-center rounded-md">
                <UtensilsCrossedIcon className="text-primary size-4" />
              </div>
              <span>Nutrizione</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xl font-medium">87%</span>
              <span className="text-muted-foreground text-sm">Aderenza</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Separator orientation="vertical" className="max-h-9.25" />
            <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full">
              <span className="text-muted-foreground text-sm">VS</span>
            </div>
            <Separator orientation="vertical" className="max-h-9.25" />
          </div>
          <div className="flex flex-1 flex-col gap-6">
            <div className="flex items-center justify-end gap-2">
              <span>Benessere</span>
              <div className="bg-primary/10 flex size-8 items-center justify-center rounded-md">
                <HeartPulseIcon className="text-primary size-4" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-xl font-medium">95%</span>
              <span className="text-muted-foreground text-sm">Obiettivo</span>
            </div>
          </div>
        </div>
        <Progress value={87} />
      </CardContent>
    </Card>
  );
};

export default StatisticsSalesOverviewCard;
