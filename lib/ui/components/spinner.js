import { cn } from "../lib/utils.js";
import { jsx } from "react/jsx-runtime";
import { IconLoader2 } from "@tabler/icons-react";

//#region src/components/spinner.tsx
function Spinner({ className,...props }) {
	return /* @__PURE__ */ jsx(IconLoader2, {
		role: "status",
		"aria-label": "Loading",
		className: cn("size-4 animate-spin", className),
		...props
	});
}

//#endregion
export { Spinner };