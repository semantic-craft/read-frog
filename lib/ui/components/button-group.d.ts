import { Separator } from "./separator.js";
import { VariantProps } from "class-variance-authority";
import * as react_jsx_runtime70 from "react/jsx-runtime";
import * as class_variance_authority_types3 from "class-variance-authority/types";

//#region src/components/button-group.d.ts
declare const buttonGroupVariants: (props?: ({
  orientation?: "horizontal" | "vertical" | null | undefined;
} & class_variance_authority_types3.ClassProp) | undefined) => string;
declare function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof buttonGroupVariants>): react_jsx_runtime70.JSX.Element;
declare function ButtonGroupText({
  className,
  asChild,
  ...props
}: React.ComponentProps<'div'> & {
  asChild?: boolean;
}): react_jsx_runtime70.JSX.Element;
declare function ButtonGroupSeparator({
  className,
  orientation,
  ...props
}: React.ComponentProps<typeof Separator>): react_jsx_runtime70.JSX.Element;
//#endregion
export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants };