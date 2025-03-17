import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function snakeCase(str: string) {
  return str.replace(/([A-Z])/g, (group) => "_" + group.toLowerCase())
}

function snakify<ValueType>(
  value: string | Record<string, ValueType>,
): string | Record<string, ValueType> {
  return (typeof value === "string")
    ? snakeCase(value)
    : Object.fromEntries(Object.entries(value).map(([k, v]) => (
      [snakeCase(k), v]
    )))
}

function camelCase(str: string) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

// TODO: resolve explicit any
function camelize(value: string): string;
function camelize<O>(value: Record<string, any>): O; // eslint-disable-line @typescript-eslint/no-explicit-any
function camelize<O>(
  value: string | Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
): string | O {
  return (typeof value === "string")
    ? camelCase(value)
    : Object.fromEntries(Object.entries(value).map(([k, v]) => (
      [camelCase(k), v]))
    ) as O
}

export {
  cn,
  camelize,
  snakify,
}