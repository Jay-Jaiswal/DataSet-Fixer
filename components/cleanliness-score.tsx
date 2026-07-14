"use client"

import { CheckCircle2 } from "lucide-react"

interface CleanlinessScoreProps {
    score: number
    issuesFound?: number
    autoFixed?: number
    needReview?: number
}

export function CleanlinessScore({ score, issuesFound = 0, autoFixed = 0, needReview = 0 }: CleanlinessScoreProps) {
    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500"
        if (score >= 60) return "text-yellow-500"
        return "text-red-500"
    }

    const getScoreGradient = (score: number) => {
        if (score >= 80) return "from-green-500/20 to-green-500/5"
        if (score >= 60) return "from-yellow-500/20 to-yellow-500/5"
        return "from-red-500/20 to-red-500/5"
    }

    const getScoreLabel = (score: number) => {
        if (score >= 80) return "Excellent"
        if (score >= 60) return "Good"
        return "Needs Improvement"
    }

    return (
        <div className={`relative overflow-hidden rounded-lg border bg-gradient-to-br ${getScoreGradient(score)} p-6`}>
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">Data Cleanliness Score</h3>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
                        <span className="text-2xl font-semibold text-muted-foreground">/ 100</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{getScoreLabel(score)}</p>
                </div>

                <div className="flex flex-col items-center">
                    <div className="relative h-24 w-24">
                        <svg className="h-full w-full -rotate-90 transform">
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                className="text-muted/30"
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 40}`}
                                strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
                                className={getScoreColor(score)}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <CheckCircle2 className={`h-8 w-8 ${getScoreColor(score)}`} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-4">
                <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{issuesFound}</div>
                    <div className="text-xs text-muted-foreground">Issues Found</div>
                </div>
                <div className="text-center border-x">
                    <div className="text-2xl font-bold text-foreground">{autoFixed}</div>
                    <div className="text-xs text-muted-foreground">Auto-Fixed</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{needReview}</div>
                    <div className="text-xs text-muted-foreground">Need Review</div>
                </div>
            </div>
        </div>
    )
}
