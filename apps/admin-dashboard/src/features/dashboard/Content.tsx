import React from "react";
import { Card } from "@fox-finance/ui";

interface ContentProps {
  loading?: boolean;
}

const Content: React.FC<ContentProps> = ({ loading }) => {
  const widgets = loading
    ? [
        "Loading Widget 1...",
        "Loading Widget 2...",
        "Loading Widget 3..."
      ]
    : [
        "Widget 1 Content",
        "Widget 2 Content",
        "Widget 3 Content"
      ];

  return (
    <main className="flex-1 p-4 space-y-4 overflow-auto">
      {widgets.map((text, i) => (
        <Card
          key={i}
          className={`p-4 ${loading ? "animate-pulse" : ""}`}
        >
          {text}
        </Card>
      ))}
    </main>
  );
};

export default Content;
