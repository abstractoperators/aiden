import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function snakeCaseToCamelCase(str: string) {
  return str.replace(/([A-Z])/g, (group) => "_" + group.toLowerCase());
}

export {
  cn,
  snakeCaseToCamelCase,
}