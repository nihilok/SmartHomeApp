import * as React from "react";

type SnackBoxVariant = "error" | "info" | "warning" | "success";

interface SnackStackBox {
  ref: React.RefObject<HTMLDivElement>;
  msg: string;
  options?: SnackBoxOptions;
}

type ISnackStack = SnackStackBox[];

interface SnackBoxOptions {
  variant?: SnackBoxVariant;
  delay?: number;
}

interface SnackBoxProps {
  msg: string;
  options?: SnackBoxOptions;
}
