"use client"

import { cn } from "@/lib/utils"

interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  count?: number
}

interface SegmentedTabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export function SegmentedTabs({ tabs, activeTab, onChange, className }: SegmentedTabsProps) {
  return (
    <div className={cn("inline-flex rounded-xl bg-muted p-1", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition",
            activeTab === tab.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn("ml-1 rounded-full px-1.5 text-xs", activeTab === tab.id ? "bg-muted text-muted-foreground" : "bg-background/50 text-muted-foreground")}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
