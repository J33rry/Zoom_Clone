import { twMerge } from "tailwind-merge";

/** Join class names, skipping falsy values; later Tailwind classes override conflicting earlier ones. */
export const cn = (...classes: Array<string | false | null | undefined>) => twMerge(classes.filter(Boolean).join(" "));
