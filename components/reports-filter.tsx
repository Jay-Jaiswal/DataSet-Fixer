"use client"

import { useState } from "react"
import { Search, Filter } from "lucide-react"

interface ReportsFilterProps {
    onFilterChange: (filters: { search: string; type: string; status: string }) => void
}

export function ReportsFilter({ onFilterChange }: ReportsFilterProps) {
    const [filters, setFilters] = useState({
        search: "",
        type: "all",
        status: "all",
    })

    const handleChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value }
        setFilters(newFilters)
        onFilterChange(newFilters)
    }

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search reports..."
                    value={filters.search}
                    onChange={(e) => handleChange("search", e.target.value)}
                    className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                    value={filters.type}
                    onChange={(e) => handleChange("type", e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    <option value="all">All Files</option>
                    <option value="model">Models (.pkl)</option>
                    <option value="csv">CSV Files</option>
                    <option value="json">JSON Files</option>
                </select>
            </div>

            {/* Status Filter */}
            <div>
                <select
                    value={filters.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="failed">Failed</option>
                </select>
            </div>
        </div>
    )
}
