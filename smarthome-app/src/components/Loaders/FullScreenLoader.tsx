import * as React from "react";
import { CircularProgress } from "@mui/material";

interface Props {
  color?: "primary" | "secondary";
}

export function FullScreenLoader({ color = "primary" }: Props) {
  return (
    <div className="loading-screen">
      <CircularProgress color={color} />
    </div>
  );
}
