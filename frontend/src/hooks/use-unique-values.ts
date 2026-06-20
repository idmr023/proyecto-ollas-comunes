import { useMemo } from "react"

export function useUniqueValues<T, K extends keyof T>(items: T[], key: K, filterFn?: (val: T[K]) => boolean): string[] {
  return useMemo(() => {
    const set = new Set<string>()
    items.forEach(item => {
      const val = item[key]
      if (val !== null && val !== undefined) {
        const str = String(val)
        if (!filterFn || filterFn(val)) set.add(str)
      }
    })
    return Array.from(set).sort()
  }, [items, key, filterFn])
}
