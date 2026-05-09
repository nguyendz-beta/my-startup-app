import React from "react";

export default function PrivateRoute({
  children,
}: {
  children?: React.ReactNode;
}) {
  return <>{children}</>;
}
