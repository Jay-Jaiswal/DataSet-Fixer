"use client"

import { Card } from "@/components/ui/card"
import { AlertTriangle, CheckCircle2, XCircle, Info } from "lucide-react"
import { useEffect, useState } from "react"

interface DatasetIssuesProps {
    file: File
}

interface Issue {
    severity: 'critical' | 'warning' | 'info'
    category: string
    description: string
    count?: number
    columns?: string[]
}

export function DatasetIssues({ file }: DatasetIssuesProps) {
    const [issues, setIssues] = useState<Issue[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        analyzeDataset()
    }, [file])

    const analyzeDataset = async () => {
        setLoading(true)
        try {
            const text = await file.text()
            let data: any[] = []

            if (file.name.endsWith('.csv')) {
                const lines = text.trim().split('\n')
                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

                data = lines.slice(1).map(line => {
                    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
                    const row: any = {}
                    headers.forEach((h, i) => {
                        row[h] = values[i]
                    })
                    return row
                })
            } else if (file.name.endsWith('.json')) {
                const jsonData = JSON.parse(text)
                data = Array.isArray(jsonData) ? jsonData : [jsonData]
            }

            const detectedIssues: Issue[] = []
            const columns = Object.keys(data[0] || {})

            // Check for missing values
            const missingValueColumns: string[] = []
            columns.forEach(col => {
                const missingCount = data.filter(row =>
                    row[col] === '' || row[col] === null || row[col] === undefined || row[col] === 'NaN'
                ).length

                if (missingCount > 0) {
                    const percentage = (missingCount / data.length * 100).toFixed(1)
                    missingValueColumns.push(`${col} (${percentage}%)`)

                    if (missingCount / data.length > 0.5) {
                        detectedIssues.push({
                            severity: 'critical',
                            category: 'Missing Data',
                            description: `Column "${col}" has ${percentage}% missing values (${missingCount}/${data.length} rows)`,
                        })
                    } else if (missingCount / data.length > 0.1) {
                        detectedIssues.push({
                            severity: 'warning',
                            category: 'Missing Data',
                            description: `Column "${col}" has ${percentage}% missing values (${missingCount}/${data.length} rows)`,
                        })
                    }
                }
            })

            // Check for duplicate rows
            const duplicateCount = data.length - new Set(data.map(row => JSON.stringify(row))).size
            if (duplicateCount > 0) {
                detectedIssues.push({
                    severity: duplicateCount > data.length * 0.1 ? 'critical' : 'warning',
                    category: 'Duplicates',
                    description: `Found ${duplicateCount} duplicate rows (${(duplicateCount / data.length * 100).toFixed(1)}%)`,
                    count: duplicateCount
                })
            }

            // Check for outliers in numeric columns
            columns.forEach(col => {
                const numericValues = data
                    .map(row => parseFloat(row[col]))
                    .filter(v => !isNaN(v))

                if (numericValues.length > 0) {
                    const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length
                    const std = Math.sqrt(
                        numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length
                    )

                    const outliers = numericValues.filter(v => Math.abs(v - mean) > 3 * std)
                    if (outliers.length > 0) {
                        detectedIssues.push({
                            severity: 'info',
                            category: 'Outliers',
                            description: `Column "${col}" has ${outliers.length} potential outliers (values > 3 standard deviations)`,
                            count: outliers.length
                        })
                    }
                }
            })

            // Check for inconsistent data types
            columns.forEach(col => {
                const types = new Set(data.map(row => {
                    const val = row[col]
                    if (val === '' || val === null || val === undefined) return 'missing'
                    if (!isNaN(parseFloat(val)) && isFinite(val)) return 'numeric'
                    return 'text'
                }))

                if (types.size > 2 || (types.size === 2 && !types.has('missing'))) {
                    detectedIssues.push({
                        severity: 'warning',
                        category: 'Data Type',
                        description: `Column "${col}" has mixed data types`,
                    })
                }
            })

            // Check for very high cardinality
            columns.forEach(col => {
                const uniqueValues = new Set(data.map(row => row[col])).size
                if (uniqueValues === data.length && data.length > 10) {
                    detectedIssues.push({
                        severity: 'info',
                        category: 'High Cardinality',
                        description: `Column "${col}" has all unique values - might be an ID column`,
                    })
                }
            })

            // Check for constant columns
            columns.forEach(col => {
                const uniqueValues = new Set(data.map(row => row[col])).size
                if (uniqueValues === 1) {
                    detectedIssues.push({
                        severity: 'warning',
                        category: 'Constant Column',
                        description: `Column "${col}" has the same value for all rows`,
                    })
                }
            })

            // Add summary
            if (detectedIssues.length === 0) {
                detectedIssues.push({
                    severity: 'info',
                    category: 'Clean Dataset',
                    description: 'No major issues detected! Your dataset looks good.',
                })
            } else {
                detectedIssues.unshift({
                    severity: 'info',
                    category: 'Summary',
                    description: `Found ${detectedIssues.length} issues in ${data.length} rows and ${columns.length} columns`,
                })
            }

            setIssues(detectedIssues)
        } catch (error) {
            console.error('Error analyzing dataset:', error)
            setIssues([{
                severity: 'critical',
                category: 'Analysis Error',
                description: 'Failed to analyze dataset. Please check the file format.',
            }])
        } finally {
            setLoading(false)
        }
    }

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical':
                return <XCircle className="h-5 w-5 text-red-500" />
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />
            case 'info':
                return <Info className="h-5 w-5 text-blue-500" />
            default:
                return <CheckCircle2 className="h-5 w-5 text-green-500" />
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-500/10 border-red-500/20'
            case 'warning':
                return 'bg-yellow-500/10 border-yellow-500/20'
            case 'info':
                return 'bg-blue-500/10 border-blue-500/20'
            default:
                return 'bg-green-500/10 border-green-500/20'
        }
    }

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Analyzing dataset for issues...</p>
                </div>
            </Card>
        )
    }

    const criticalIssues = issues.filter(i => i.severity === 'critical').length
    const warningIssues = issues.filter(i => i.severity === 'warning').length

    return (
        <Card className="p-6">
            <div className="mb-4">
                <h2 className="text-xl font-bold text-foreground mb-2">Dataset Quality Report</h2>
                <div className="flex gap-4 text-sm">
                    {criticalIssues > 0 && (
                        <div className="flex items-center gap-1 text-red-500">
                            <XCircle className="h-4 w-4" />
                            <span>{criticalIssues} Critical</span>
                        </div>
                    )}
                    {warningIssues > 0 && (
                        <div className="flex items-center gap-1 text-yellow-500">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{warningIssues} Warnings</span>
                        </div>
                    )}
                    {criticalIssues === 0 && warningIssues === 0 && (
                        <div className="flex items-center gap-1 text-green-500">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Dataset looks good!</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {issues.map((issue, idx) => (
                    <div
                        key={idx}
                        className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}
                    >
                        <div className="flex items-start gap-3">
                            {getSeverityIcon(issue.severity)}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-foreground text-sm">
                                        {issue.category}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{issue.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    )
}
