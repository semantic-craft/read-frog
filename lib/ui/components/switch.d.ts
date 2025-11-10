import { VariantProps } from "class-variance-authority";
import * as React from "react";
import * as react_jsx_runtime141 from "react/jsx-runtime";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as class_variance_authority_types7 from "class-variance-authority/types";

//#region src/components/switch.d.ts
declare const switchVariants: (props?: ({
  variant?: "default" | "monochrome" | null | undefined;
} & class_variance_authority_types7.ClassProp) | undefined) => string;
declare function Switch({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & VariantProps<typeof switchVariants>): react_jsx_runtime141.JSX.Element;
type SwitchProps = VariantProps<typeof switchVariants>;
//#endregion
export { Switch, SwitchProps, switchVariants };