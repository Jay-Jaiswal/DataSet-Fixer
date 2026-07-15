"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, TrendingUp, Target, Award, Download, Activity, BarChart } from "lucide-react"

interface ModelResultsProps {
    isVisible: boolean
    results?: any
}

export function ModelResults({ isVisible, results }: ModelResultsProps) {
    if (!isVisible || !results) return null

    const handleDownload = () => {
        const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}${results.model_download_url}`
        window.open(downloadUrl, '_blank')
    }

    // Format metrics based on task type
    const formatMetric = (value: number) => {
        return `${(value * 100).toFixed(1)}%`
    }

    const formatNumber = (value: number, decimals: number = 2) => {
        return value.toFixed(decimals)
    }

    // Prepare metrics array based on task type
    type MetricType = {
        label: string
        value: string
        icon: any
        color: string
    }

    let metrics: MetricType[] = []
    if (results.task_type === 'classification') {
        metrics = [
            { label: "Accuracy", value: formatMetric(results.metrics.accuracy), icon: Target, color: "text-green-500" },
            { label: "Precision", value: formatMetric(results.metrics.precision), icon: CheckCircle2, color: "text-blue-500" },
            { label: "Recall", value: formatMetric(results.metrics.recall), icon: TrendingUp, color: "text-purple-500" },
            { label: "F1 Score", value: formatMetric(results.metrics.f1_score), icon: Award, color: "text-orange-500" },
        ]
    } else if (results.task_type === 'regression') {
        metrics = [
            { label: "R² Score", value: formatNumber(results.metrics.r2_score, 3), icon: Target, color: "text-green-500" },
            { label: "MAE", value: formatNumber(results.metrics.mae), icon: Activity, color: "text-blue-500" },
            { label: "RMSE", value: formatNumber(results.metrics.rmse), icon: TrendingUp, color: "text-purple-500" },
            { label: "MSE", value: formatNumber(results.metrics.mse), icon: BarChart, color: "text-orange-500" },
        ]
    }

    return (
        <div className="space-y-6">
            {/* Success Message & Download */}
            <Card className="p-6 bg-green-500/10 border-green-500/20">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                            <h3 className="text-xl font-bold text-foreground">Model Trained Successfully!</h3>
                        </div>
                        <p className="text-muted-foreground mb-3">
                            {results.model_type} model trained on {results.target_column} with {results.train_test_split} split
                        </p>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <p><strong>Model Type:</strong> {results.model_type}</p>
                            <p><strong>Task Type:</strong> {results.task_type}</p>
                            <p><strong>Features:</strong> {results.feature_columns.join(', ')}</p>
                        </div>
                    </div>
                    <Button onClick={handleDownload} className="ml-4">
                        <Download className="h-4 w-4 mr-2" />
                        Download Model
                    </Button>
                </div>
            </Card>

            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {metrics.map((metric, idx) => (
                    <Card key={metric.label} className="p-6 animate-scale-in" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div className="flex items-start justify-between mb-3">
                            <metric.icon className={`h-5 w-5 ${metric.color}`} />
                            <span className={`text-2xl font-bold ${metric.color}`}>{metric.value}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{metric.label}</p>
                    </Card>
                ))}
            </div>

            {/* Visualization (Confusion Matrix or Actual vs Predicted) */}
            {results.confusion_matrix_plot && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                        {results.task_type === 'classification' ? 'Confusion Matrix' : 'Actual vs Predicted'}
                    </h3>
                    <div className="max-w-2xl mx-auto">
                        <img
                            src={`data:image/png;base64,${results.confusion_matrix_plot}`}
                            alt={results.task_type === 'classification' ? 'Confusion Matrix' : 'Actual vs Predicted'}
                            className="w-full rounded-lg"
                        />
                    </div>
                </Card>
            )}

            {/* Detailed Metrics */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Model Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-muted-foreground">Model Filename</p>
                            <p className="font-mono text-sm">{results.model_filename}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Target Column</p>
                            <p className="font-semibold">{results.target_column}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Number of Features</p>
                            <p className="font-semibold">{results.feature_columns.length}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-muted-foreground">Train/Test Split</p>
                            <p className="font-semibold">{results.train_test_split}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Training Time</p>
                            <p className="font-semibold">{results.timestamp}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Model Status</p>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-sm font-semibold">
                                <CheckCircle2 className="h-3 w-3" />
                                Ready for Download
                            </span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}
