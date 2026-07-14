"use client"

interface CleaningIssueCardProps {
    title: string
    description: string
    icon: React.ReactNode
    count: number
    color: "red" | "yellow" | "orange" | "green"
}

export function CleaningIssueCard({ title, description, icon, count, color }: CleaningIssueCardProps) {
    const colorClasses = {
        red: "bg-red-500/10 text-red-500 border-red-500/20",
        yellow: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        orange: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        green: "bg-green-500/10 text-green-500 border-green-500/20",
    }

    const badgeClasses = {
        red: "bg-red-500/20 text-red-600 dark:text-red-400",
        yellow: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
        orange: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
        green: "bg-green-500/20 text-green-600 dark:text-green-400",
    }

    return (
        <div className="group relative overflow-hidden rounded-lg border bg-card p-6 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
                <div className={`rounded-lg p-3 ${colorClasses[color]} border transition-colors`}>
                    {icon}
                </div>
                <div className={`rounded-full px-3 py-1 text-sm font-semibold ${badgeClasses[color]}`}>
                    {count} found
                </div>
            </div>

            <div className="mt-4 space-y-2">
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
    )
}
