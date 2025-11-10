import { VariantProps } from "class-variance-authority";
import * as React from "react";
import * as react_jsx_runtime0 from "react/jsx-runtime";
import * as class_variance_authority_types0 from "class-variance-authority/types";

//#region src/components/button.d.ts
declare const buttonVariants: (props?: ({
  variant?: "default" | "secondary" | "destructive" | "outline" | "outline-primary" | "ghost" | "link" | null | undefined;
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg" | null | undefined;
} & class_variance_authority_types0.ClassProp) | undefined) => string;
declare function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & {
  asChild?: boolean;
}): react_jsx_runtime0.JSX.Element;
type ButtonProps = VariantProps<typeof buttonVariants>;
//#endregion
export { Button, ButtonProps, buttonVariants };