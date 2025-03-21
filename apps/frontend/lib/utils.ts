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
// TODO: extend to more general objects
// TODO: https://github.com/kbrabrand/camelize-ts/blob/main/src/index.ts
function camelize(value: string): string;
function camelize<O>(value: Record<string, any>): O; // eslint-disable-line @typescript-eslint/no-explicit-any
function camelize<O>(value: Record<string, any>[]): O; // eslint-disable-line @typescript-eslint/no-explicit-any
function camelize<O>(
  value: string | Record<string, any> | Record<string, any>[], // eslint-disable-line @typescript-eslint/no-explicit-any
): string | O {
  if (typeof value === "string") {
    return camelCase(value)
  } else if (value instanceof Array) {
    return value.map(item => camelize(item)) as O
  } else {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => (
      [camelCase(k), v]))
    ) as O
  }
}

export {
  cn,
  camelize,
  snakify,
}