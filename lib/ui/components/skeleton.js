import { cn } from "../lib/utils.js";
import "react";
import { jsx } from "react/jsx-runtime";

//#region src/components/skeleton.tsx
function Skeleton({ className,...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "skeleton",
		className: cn("bg-accent animate-pulse rounded-md", className),
		...props
	});
}

//#endregion
export { Skeleton };