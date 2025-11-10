import { Separator } from "./separator.js";
import { VariantProps } from "class-variance-authority";
import * as React from "react";
import * as react_jsx_runtime127 from "react/jsx-runtime";
import * as class_variance_authority_types5 from "class-variance-authority/types";

//#region src/components/item.d.ts
declare function ItemGroup({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime127.JSX.Element;
declare function ItemSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>): react_jsx_runtime127.JSX.Element;
declare const itemVariants: (props?: ({
  variant?: "default" | "outline" | "muted" | null | undefined;
  size?: "default" | "sm" | null | undefined;
} & class_variance_authority_types5.ClassProp) | undefined) => string;
declare function Item({
  className,
  variant,
  size,
  asChild,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof itemVariants> & {
  asChild?: boolean;
}): react_jsx_runtime127.JSX.Element;
declare const itemMediaVariants: (props?: ({
  variant?: "default" | "icon" | "image" | null | undefined;
} & class_variance_authority_types5.ClassProp) | undefined) => string;
declare function ItemMedia({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof itemMediaVariants>): react_jsx_runtime127.JSX.Element;
declare function ItemContent({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime127.JSX.Element;
declare function ItemTitle({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime127.JSX.Element;
declare function ItemDescription({
  className,
  ...props
}: React.ComponentProps<'p'>): react_jsx_runtime127.JSX.Element;
declare function ItemActions({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime127.JSX.Element;
declare function ItemHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime127.JSX.Element;
declare function ItemFooter({
  className,
  ...props
}: React.ComponentProps<'div'>): react_jsx_runtime127.JSX.Element;
//#endregion
export { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemHeader, ItemMedia, ItemSeparator, ItemTitle };