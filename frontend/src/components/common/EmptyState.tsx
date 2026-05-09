import React from "react";

export default function EmptyState({
  message = "No data",
}: {
  message?: string;
}) {
  return <div className="text-center py-6">{message}</div>;
}

