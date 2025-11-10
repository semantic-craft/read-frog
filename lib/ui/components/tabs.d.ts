import * as React from "react";
import * as react_jsx_runtime137 from "react/jsx-runtime";
import * as TabsPrimitive from "@radix-ui/react-tabs";

//#region src/components/tabs.d.ts
declare function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>): react_jsx_runtime137.JSX.Element;
declare function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>): react_jsx_runtime137.JSX.Element;
declare function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>): react_jsx_runtime137.JSX.Element;
declare function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>): react_jsx_runtime137.JSX.Element;
//#endregion
export { Tabs, TabsContent, TabsList, TabsTrigger };