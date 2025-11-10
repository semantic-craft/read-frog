import { VariantProps } from "class-variance-authority";
import * as React from "react";
import * as react_jsx_runtime147 from "react/jsx-runtime";
import * as class_variance_authority_types8 from "class-variance-authority/types";

//#region src/components/alert.d.ts
declare const alertVariants: (props?: ({
  variant?: "default" | "destructive" | null | undefined;
} & class_variance_authority_types8.ClassProp) | undefined) => string;
declare function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>): react_jsx_runtime147.JSX.Element;
declare function AlertTitle({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime147.JSX.Element;
declare function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime147.JSX.Element;
//#endregion
export { Alert, AlertDescription, AlertTitle };