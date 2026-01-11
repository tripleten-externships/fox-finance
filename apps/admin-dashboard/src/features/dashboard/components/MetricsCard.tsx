// Create Metrics Card
import React from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
 
} from "@fox-finance/ui";

interface MetricsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    descriptor: string;
}

const MetricsCard = ({title, value, icon, descriptor} :MetricsCardProps) => {


return (
    <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{title}</CardTitle>
                  <div className="h-6 w-6 text-muted-foreground">{icon}</div>
                </div> 
              </CardHeader>
              <CardContent className="px-6">
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{descriptor}</p>
              </CardContent>
              
            </Card>
            
);

}

export default MetricsCard;
