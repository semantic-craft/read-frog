import { VariantProps } from "class-variance-authority";
import * as React from "react";
import * as react_jsx_runtime67 from "react/jsx-runtime";
import * as class_variance_authority_types2 from "class-variance-authority/types";

//#region src/components/badge.d.ts
declare const badgeVariants: (props?: ({
  variant?: "default" | "secondary" | "destructive" | "outline" | null | undefined;
  size?: "default" | "sm" | null | undefined;
} & class_variance_authority_types2.ClassProp) | undefined) => string;
declare function Badge({
  className,
  variant,
  size,
  asChild,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & {
  asChild?: boolean;
}): react_jsx_runtime67.JSX.Element;
//#endregion
export { Badge, badgeVariants };