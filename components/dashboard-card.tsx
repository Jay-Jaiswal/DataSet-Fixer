"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface DashboardCardProps {
    title: string
    description: string
    icon: React.ReactNode
    href: string
}

export function DashboardCard({ title, description, icon, href }: DashboardCardProps) {
    return (
        <Link
            href={href}
            className="group relative overflow-hidden rounded-xl border-2 bg-card p-6 transition-all duration-300 hover:shadow-2xl hover:border-primary hover:-translate-y-1 flex flex-col h-full"
        >
            <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                    <div className="rounded-xl bg-primary/10 p-3 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                        {icon}
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:translate-x-2 group-hover:text-primary" />
                </div>

                <div className="flex-1 flex flex-col">
                    <h3 className="font-bold text-lg mb-3 group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>

            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </Link>
    )
}
