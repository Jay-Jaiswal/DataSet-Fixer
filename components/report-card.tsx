"use client"

import { Download, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ReportCardProps {
    id: string
    datasetName: string
    date: string
    accuracy?: number
    status: "completed" | "in-progress" | "failed"
    type: "training" | "cleaning"
    modelType?: string
    f1Score?: number
    cleanlinessScore?: number
}

export function ReportCard({ datasetName, date, accuracy, status, type, modelType, cleanlinessScore }: ReportCardProps) {
    const statusColors = {
        completed: "bg-green-500/10 text-green-600 dark:text-green-400",
        "in-progress": "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
        failed: "bg-red-500/10 text-red-600 dark:text-red-400",
    }

    const typeColors = {
        training: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        cleaning: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    }

    return (
        <Card className="group hover:shadow-lg transition-all duration-200">
            <div className="p-6 space-y-4">
                {/* Header */}
                <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1 text-base">
                            {datasetName}
                        </h3>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusColors[status]}`}>
                            {status === "in-progress" ? "In Progress" : status}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">{date}</p>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${typeColors[type]}`}>
                            {type === "training" ? "Model Training" : "Data Cleaning"}
                        </span>
                    </div>
                </div>

                {/* Metrics */}
                {type === "training" && accuracy !== undefined && (
                    <div className="space-y-3 pt-2 border-t border-border/50">
                        {modelType && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Model:</span>
                                <span className="font-medium text-foreground">{modelType}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Accuracy:</span>
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">{accuracy.toFixed(1)}%</span>
                        </div>
                    </div>
                )}

                {type === "cleaning" && cleanlinessScore !== undefined && (
                    <div className="pt-2 border-t border-border/50">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Cleanliness:</span>
                            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{cleanlinessScore.toFixed(0)}%</span>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3">
                    <Button variant="outline" size="sm" className="flex-1 gap-2 bg-transparent hover:bg-accent">
                        <ExternalLink className="h-4 w-4" />
                        View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-2 bg-transparent hover:bg-accent">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>
        </Card>
    )
}
