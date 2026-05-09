import React from "react";

export default function ConfirmDialog({ message }: { message?: string }) {
  return <div className="p-4">{message || "Are you sure?"}</div>;
}

