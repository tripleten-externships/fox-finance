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
import { Button } from "@fox-finance/ui";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#8dd1e1", "#a4de6c", "#d0ed57", "#ffc0cb"];

const Charts: React.FC = () => {
  const [data, setData] = useState<{
    uploadsOverTime: { day: string; count: number }[];
    uploadsByClient: { clientId: string; count: number }[];
    fileTypes: { fileType: string; count: number }[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState(localStorage.getItem("chartRange") || "30d");

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/admin/stats/trends?range=${range}`);
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
        ...data.uploadsOverTime.map(u => ["Upload", u.day, u.count]),
        ...data.uploadsByClient.map(c => ["Client", c.clientId, c.count]),
        ...data.fileTypes.map(f => ["FileType", f.fileType, f.count]),
      ],
    ];
    const csvString = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chart_data_${range}.csv`;
    a.click();
  };

  if (loading) return <p>Loading charts...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!data) return <p>No data available</p>;

  return (
    <div className="space-y-8 min-w-0">
      {/* ✅ Range buttons and CSV export */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["7d", "30d", "90d", "1y"].map(r => (
          <Button
            key={r}
            variant={r === range ? "default" : "outline"}
            onClick={() => handleRangeChange(r)}
          >
            {r}
          </Button>
        ))}
        <Button onClick={exportCSV}>Export CSV</Button>
      </div>

      {/* Line Chart */}
      <div>
        <h3>Uploads Over Time</h3>
        {data.uploadsOverTime.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upload data available for the selected range.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.uploadsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <ReTooltip />
              <Line type="monotone" dataKey="count" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bar Chart */}
      <div>
        <h3>Uploads By Client</h3>
        {data.uploadsByClient.length === 0 ? (
          <p className="text-sm text-muted-foreground">No client upload data available for the selected range.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.uploadsByClient}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="clientId" />
              <YAxis />
              <ReTooltip />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie Chart */}
      <div>
        <h3>File Type Distribution</h3>
        {data.fileTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No file type data available for the selected range.</p>
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
              <ReTooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default Charts;
