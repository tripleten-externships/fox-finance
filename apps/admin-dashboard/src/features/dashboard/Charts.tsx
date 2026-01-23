import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@fox-finance/ui";
import { apiClient } from "../../lib/api";

// Theme-aware colors using HSL values that work in both light and dark modes
const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const Charts: React.FC = () => {
  const [data, setData] = useState<{
    uploadsOverTime: { day: string; count: number }[];
    uploadsByClient: { clientId: string; count: number }[];
    fileTypes: { fileType: string; count: number }[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState(
    localStorage.getItem("chartRange") || "30d",
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient(`/api/admin/stats/trends?range=${range}`);
        if (!res.ok) throw new Error("Failed to fetch trend data");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [range]);

  const handleRangeChange = (newRange: string) => {
    setRange(newRange);
    localStorage.setItem("chartRange", newRange);
  };

  const exportCSV = () => {
    if (!data) return;
    const csvRows = [
      ["Type", "Label", "Count"],
      ...[
        ...data.uploadsOverTime.map((u) => ["Upload", u.day, u.count]),
        ...data.uploadsByClient.map((c) => ["Client", c.clientId, c.count]),
        ...data.fileTypes.map((f) => ["FileType", f.fileType, f.count]),
      ],
    ];
    const csvString = csvRows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chart_data_${range}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading charts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      {/* Range buttons and CSV export */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {["7d", "30d", "90d", "1y"].map((r) => (
              <Button
                key={r}
                variant={r === range ? "default" : "outline"}
                onClick={() => handleRangeChange(r)}
              >
                {r}
              </Button>
            ))}
            <Button onClick={exportCSV} variant="outline">
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Uploads Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {data.uploadsOverTime.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No upload data available for the selected range.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.uploadsOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <ReTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={COLORS[0]}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Uploads By Client</CardTitle>
        </CardHeader>
        <CardContent>
          {data.uploadsByClient.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No client upload data available for the selected range.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.uploadsByClient}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="clientId" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <ReTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="count" fill={COLORS[1]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">
            File Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.fileTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No file type data available for the selected range.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.fileTypes}
                  dataKey="count"
                  nameKey="fileType"
                  outerRadius={100}
                  label
                >
                  {data.fileTypes.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Charts;
