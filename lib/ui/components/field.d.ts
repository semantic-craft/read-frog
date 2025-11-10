import { Label } from "./label.js";
import { VariantProps } from "class-variance-authority";
import * as react_jsx_runtime50 from "react/jsx-runtime";
import * as class_variance_authority_types1 from "class-variance-authority/types";

//#region src/components/field.d.ts
declare function FieldSet({
  className,
  ...props
}: React.ComponentProps<'fieldset'>): react_jsx_runtime50.JSX.Element;
declare function FieldLegend({
  className,
  variant,
  ...props
}: React.ComponentProps<'legend'> & {
  variant?: 'legend' | 'label';
}): react_jsx_runtime50.JSX.Element;
declare function FieldGroup({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime50.JSX.Element;
declare const fieldVariants: (props?: ({
  orientation?: "horizontal" | "vertical" | "responsive" | null | undefined;
} & class_variance_authority_types1.ClassProp) | undefined) => string;
declare function Field({
  className,
  orientation,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof fieldVariants>): react_jsx_runtime50.JSX.Element;
declare function FieldContent({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime50.JSX.Element;
declare function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>): react_jsx_runtime50.JSX.Element;
declare function FieldTitle({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime50.JSX.Element;
declare function FieldDescription({
  className,
  ...props
}: React.ComponentProps<'p'>): react_jsx_runtime50.JSX.Element;
declare function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  children?: React.ReactNode;
}): react_jsx_runtime50.JSX.Element;
declare function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<'div'> & {
  errors?: Array<{
    message?: string;
  } | undefined>;
}): react_jsx_runtime50.JSX.Element | null;
//#endregion
export { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet, FieldTitle };