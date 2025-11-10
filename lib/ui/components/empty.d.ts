import { VariantProps } from "class-variance-authority";
import * as react_jsx_runtime8 from "react/jsx-runtime";
import * as class_variance_authority_types0 from "class-variance-authority/types";

//#region src/components/empty.d.ts
declare function Empty({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime8.JSX.Element;
declare function EmptyHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime8.JSX.Element;
declare const emptyMediaVariants: (props?: ({
  variant?: "default" | "icon" | null | undefined;
} & class_variance_authority_types0.ClassProp) | undefined) => string;
declare function EmptyMedia({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>): react_jsx_runtime8.JSX.Element;
declare function EmptyTitle({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime8.JSX.Element;
declare function EmptyDescription({
  className,
  ...props
}: React.ComponentProps<'p'>): react_jsx_runtime8.JSX.Element;
declare function EmptyContent({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime8.JSX.Element;
//#endregion
export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle };