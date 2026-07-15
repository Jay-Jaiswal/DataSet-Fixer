"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface TrainingFormProps {
    onTrain: (config: any) => void
    onRecommend: (config: any) => void
    columns: string[]
    loading?: boolean
    recommending?: boolean
    recommendation?: { recommended_model: string; score: number; metric: string } | null
}

const algorithms = {
    classification: [
        ["RandomForest", "Random Forest"], ["ExtraTrees", "Extra Trees"], ["LogisticRegression", "Logistic Regression"],
        ["DecisionTree", "Decision Tree"], ["GradientBoosting", "Gradient Boosting"], ["AdaBoost", "AdaBoost"],
        ["HistGradientBoosting", "Histogram Gradient Boosting"], ["KNN", "K-Nearest Neighbors"], ["SVM", "Support Vector Machine"], ["XGBoost", "XGBoost"],
    ],
    regression: [
        ["RandomForest", "Random Forest"], ["ExtraTrees", "Extra Trees"], ["LinearRegression", "Linear Regression"], ["Ridge", "Ridge"], ["Lasso", "Lasso"], ["ElasticNet", "Elastic Net"],
        ["DecisionTree", "Decision Tree"], ["GradientBoosting", "Gradient Boosting"], ["AdaBoost", "AdaBoost"], ["HistGradientBoosting", "Histogram Gradient Boosting"], ["KNN", "K-Nearest Neighbors"], ["XGBoost", "XGBoost"],
    ],
} as const

export function TrainingForm({ onTrain, onRecommend, columns, loading = false, recommending = false, recommendation = null }: TrainingFormProps) {
    const [config, setConfig] = useState({
        targetColumn: "",
        algorithm: "RandomForest",
        taskType: "classification",
        testSize: 20,
        randomState: 42,
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!config.targetColumn) {
            alert('Please select a target column')
            return
        }
        onTrain(config)
    }

    return (
        <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Target Column */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Target Column *
                    </label>
                    <select
                        value={config.targetColumn}
                        onChange={(e) => setConfig({ ...config, targetColumn: e.target.value })}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                        disabled={loading}
                    >
                        <option value="">Select target column</option>
                        {columns.map((col) => (
                            <option key={col} value={col}>{col}</option>
                        ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                        The column you want to predict
                    </p>
                </div>

                {/* Task Type */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Task Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { value: "classification", label: "Classification" },
                            { value: "regression", label: "Regression" },
                        ].map((task) => (
                            <label
                                key={task.value}
                                className={`flex items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all ${config.taskType === task.value
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="taskType"
                                    value={task.value}
                                    checked={config.taskType === task.value}
                                    onChange={(e) => setConfig({ ...config, taskType: e.target.value, algorithm: "RandomForest" })}
                                    className="sr-only"
                                    disabled={loading}
                                />
                                <span className="text-sm font-medium">{task.label}</span>
                            </label>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Classification for categories, Regression for numbers
                    </p>
                </div>

                {/* Algorithm Selection */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Algorithm
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {algorithms[config.taskType as keyof typeof algorithms].map(([value, label]) => (
                            <label
                                key={value}
                                className={`flex items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all ${config.algorithm === value
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="algorithm"
                                    value={value}
                                    checked={config.algorithm === value}
                                    onChange={(e) => setConfig({ ...config, algorithm: e.target.value })}
                                    className="sr-only"
                                    disabled={loading}
                                />
                                <span className="text-sm font-medium">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Test Size */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Test Size: {config.testSize}%
                    </label>
                    <input
                        type="range"
                        min="10"
                        max="40"
                        step="5"
                        value={config.testSize}
                        onChange={(e) => setConfig({ ...config, testSize: parseInt(e.target.value) })}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        disabled={loading}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>10%</span>
                        <span>40%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Percentage of data reserved for testing
                    </p>
                </div>

                {/* Random State */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Random State
                    </label>
                    <input
                        type="number"
                        value={config.randomState}
                        onChange={(e) => setConfig({ ...config, randomState: parseInt(e.target.value) })}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Seed for reproducible results
                    </p>
                </div>

                {recommendation && <p className="rounded-md bg-primary/10 p-3 text-sm">Recommended: <strong>{recommendation.recommended_model}</strong> ({recommendation.metric === "accuracy" ? "accuracy" : "R²"}: {recommendation.score.toFixed(4)})</p>}
                <Button type="button" variant="outline" className="w-full" disabled={loading || recommending || !config.targetColumn} onClick={() => onRecommend(config)}>
                    {recommending ? "Comparing algorithms..." : "Recommend Best Algorithm"}
                </Button>
                <Button type="submit" className="w-full" disabled={loading || recommending}>
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Training Model...
                        </>
                    ) : (
                        'Start Training'
                    )}
                </Button>
            </form>
        </Card>
    )
}
