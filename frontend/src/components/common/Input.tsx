import React from "react";

export default function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return <input className="border p-2 rounded" {...props} />;
}
