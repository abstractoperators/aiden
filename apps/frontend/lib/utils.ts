import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Chain, sei, seiTestnet } from "viem/chains"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function snakeCase(str: string) {
  return str.replace(/([A-Z])/g, (group) => "_" + group.toLowerCase())
}

function snakify<T>(
  value: string | Record<string, T>,
): string | Record<string, T> {
  return (typeof value === "string")
    ? snakeCase(value)
    : Object.fromEntries(Object.entries(value).map(([k, v]) => (
      [snakeCase(k), v]
    )))
}

function camelCase(str: string) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

// TODO: extend to more general objects
// TODO: https://github.com/kbrabrand/camelize-ts/blob/main/src/index.ts
function camelize(value: string): string;
function camelize<O>(value: Record<string, unknown>): O;
function camelize<O>(value: Record<string, unknown>[]): O;
function camelize<O>(
  value: string | Record<string, unknown> | Record<string, unknown>[],
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

function getSeiNet(): Chain {
  switch (process.env.NEXT_SEI_NET) {
    case "main":
      return sei
    case "test":
    default:
      return seiTestnet
  }
}

export {
  cn,
  camelize,
  getSeiNet,
  snakify,
}