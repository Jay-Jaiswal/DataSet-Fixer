"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download, FileCheck, PlayCircle, AlertCircle, Brain, Database, FileText } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface TrainedModel {
  id: string
  filename: string
  file_url: string
  model_type: string
  task_type: string
  target_column: string
  accuracy?: number
  precision?: number
  recall?: number
  f1_score?: number
  r2_score?: number
  mae?: number
  mse?: number
  rmse?: number
  created_at: string
}

interface TestResult {
  success: boolean
  model_filename: string
  model_type: string
  task_type: string
  feature_columns: string[]
  tested_target_column?: string | null
  stored_target_column?: string | null
  has_actual_target: boolean
  prediction_count: number
  metrics: Record<string, number>
  predictions_preview: Array<{
    row: number
    predicted: unknown
    actual?: unknown
    match?: boolean
  }>
}

function formatMetricLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function TestModelPage() {
  const [models, setModels] = useState<TrainedModel[]>([])
  const [selectedModel, setSelectedModel] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [targetColumn, setTargetColumn] = useState("")
  const [loadingModels, setLoadingModels] = useState(true)
  const [loadingFile, setLoadingFile] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoadingModels(true)
        const response = await fetch("http://localhost:8000/api/list-files/")

        if (!response.ok) {
          throw new Error("Failed to fetch trained models")
        }

        const data = await response.json()
        const modelList: TrainedModel[] = data.models || []
        setModels(modelList)

        if (!selectedModel && modelList.length > 0) {
          setSelectedModel(modelList[0].filename)
        }
      } catch (err) {
        console.error("Error loading models:", err)
        setError(err instanceof Error ? err.message : "Failed to load trained models")
      } finally {
        setLoadingModels(false)
      }
    }

    fetchModels()
  }, [selectedModel])

  const activeModel = useMemo(
    () => models.find((model) => model.filename === selectedModel) || null,
    [models, selectedModel]
  )

  useEffect(() => {
    if (activeModel?.target_column && columns.includes(activeModel.target_column) && !targetColumn) {
      setTargetColumn(activeModel.target_column)
    }
  }, [activeModel, columns, targetColumn])

  const loadFileColumns = async (file: File) => {
    setLoadingFile(true)
    setError(null)

    try {
      const text = await file.text()
      const cleaned = text.trim()

      if (!cleaned) {
        setColumns([])
        return
      }

      if (file.name.toLowerCase().endsWith(".json")) {
        const parsed = JSON.parse(text)
        const records = Array.isArray(parsed) ? parsed : [parsed]
        setColumns(records.length > 0 ? Object.keys(records[0]) : [])
      } else if (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")) {
        // Excel is parsed by the backend. Its saved model target is detected there automatically.
        setColumns([])
      } else {
        const firstLine = cleaned.split("\n")[0]
        setColumns(firstLine.split(",").map((header) => header.trim().replace(/^"|"$/g, "")))
      }
    } catch (err) {
      console.error("Error reading test file:", err)
      setError("Failed to read the uploaded file. Please use a valid CSV or JSON file.")
      setColumns([])
    } finally {
      setLoadingFile(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploadedFile(file)
    setResult(null)
    await loadFileColumns(file)
  }

  const handleTestModel = async () => {
    if (!uploadedFile) {
      setError("Please upload a dataset to test the model")
      return
    }

    if (!selectedModel) {
      setError("Please select a trained model")
      return
    }

    setTesting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", uploadedFile)
      formData.append("model_filename", selectedModel)

      if (targetColumn) {
        formData.append("target_column", targetColumn)
      }

      const response = await fetch("http://localhost:8000/api/test-model/", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.detail || "Testing failed")
      }

      const data: TestResult = await response.json()
      setResult(data)
    } catch (err) {
      console.error("Error testing model:", err)
      setError(err instanceof Error ? err.message : "Testing failed")
    } finally {
      setTesting(false)
    }
  }

  const selectedModelDownload = selectedModel
    ? `http://localhost:8000/api/download-model/${encodeURIComponent(selectedModel)}`
    : ""

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 animate-slide-up">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <h1 className="mb-3 text-4xl font-bold text-foreground">Test Trained Model</h1>
          <p className="max-w-3xl text-lg text-muted-foreground">
            Pick a downloaded model, upload fresh data, and compare the predictions with your actual target column if
            you have one.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 animate-slide-up">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-500">Error</h3>
              <p className="text-sm text-red-500/90">{error}</p>
            </div>
          </div>
        )}

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">Choose a trained model</h2>
                  <p className="text-sm text-muted-foreground">Select a model that was trained and saved in the backend.</p>
                </div>
                <div className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                  {models.length} available
                </div>
              </div>

              {loadingModels ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  Loading trained models...
                </div>
              ) : models.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {models.map((model) => {
                    const isActive = model.filename === selectedModel
                    return (
                      <button
                        key={model.filename}
                        type="button"
                        onClick={() => setSelectedModel(model.filename)}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          isActive
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:border-primary/50"
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground">{model.model_type}</span>
                          </div>
                          <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                            {model.task_type}
                          </span>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">{model.filename}</p>
                        <p className="mt-2 text-xs text-muted-foreground">Target: {model.target_column || "Unknown"}</p>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  No trained models found yet.
                </div>
              )}
            </Card>

            <Card className="p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold text-foreground">Upload test data</h2>
                <p className="text-sm text-muted-foreground">Use the same feature columns that were used during training.</p>
              </div>

              <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".csv,.json,.xlsx,.xls"
                  className="hidden"
                  id="test-dataset-input"
                  onChange={handleFileUpload}
                  disabled={testing}
                />
                <label htmlFor="test-dataset-input" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">{loadingFile ? "Reading file..." : "Drop your dataset here"}</p>
                      <p className="text-sm text-muted-foreground">or click to browse CSV, JSON, or Excel</p>
                    </div>
                  </div>
                </label>
              </div>

              {uploadedFile && (
                <div className="mt-4 rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <FileCheck className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="font-semibold text-foreground">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadedFile.size / 1024).toFixed(2)} KB • {columns.length} columns
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setUploadedFile(null)}>
                      Change File
                    </Button>
                  </div>
                </div>
              )}

              {columns.length > 0 && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Actual Target Column</label>
                    <select
                      value={targetColumn}
                      onChange={(e) => setTargetColumn(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={testing}
                    >
                      <option value="">Skip metric comparison</option>
                      {columns.map((column) => (
                        <option key={column} value={column}>
                          {column}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-muted-foreground">Choose the real label column if you want accuracy metrics.</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Selected Model</label>
                    <div className="rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                      {activeModel ? `${activeModel.model_type} - ${activeModel.task_type}` : "Select a trained model"}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={handleTestModel} disabled={testing || !uploadedFile || !selectedModel}>
                  {testing ? (
                    <>
                      <svg className="mr-3 h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Testing Model...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Run Test
                    </>
                  )}
                </Button>

                {selectedModelDownload && (
                  <Button variant="outline" asChild>
                    <a href={selectedModelDownload} target="_blank" rel="noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download Selected Model
                    </a>
                  </Button>
                )}
              </div>
            </Card>

            {result && (
              <Card className="p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">Test Results</h2>
                    <p className="text-sm text-muted-foreground">
                      Predictions for {result.prediction_count} rows using {result.model_type}.
                    </p>
                  </div>
                  <div className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                    {result.task_type}
                  </div>
                </div>

                <div className="mb-6 grid gap-3 rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground md:grid-cols-2">
                  <div>
                    <span className="font-medium text-foreground">Resolved target column:</span>{" "}
                    {result.tested_target_column || "Not provided"}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Actual values:</span>{" "}
                    {result.has_actual_target ? "Available" : "Not found in uploaded file"}
                  </div>
                </div>

                {!result.has_actual_target && (
                  <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
                    The uploaded file does not include the actual target column, so only predicted values can be shown.
                    Upload a labeled dataset or select a target column that exists in the file to see Actual values side by side.
                  </div>
                )}

                {Object.keys(result.metrics).length > 0 && (
                  <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Object.entries(result.metrics).map(([key, value]) => (
                      <div key={key} className="rounded-xl border bg-muted/20 p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{formatMetricLabel(key)}</p>
                        <p className="mt-2 text-2xl font-bold text-foreground">
                          {typeof value === "number" ? value.toFixed(4) : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {result.predictions_preview.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="min-w-full divide-y divide-border text-sm">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-foreground">Row</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">Predicted</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">Actual</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">Match</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-background">
                        {result.predictions_preview.map((row, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-muted-foreground">{row.row}</td>
                            <td className="px-4 py-3 text-muted-foreground">{String(row.predicted ?? "-")}</td>
                            <td className="px-4 py-3 text-muted-foreground">{String(row.actual ?? "-")}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {typeof row.match === "boolean" ? (row.match ? "Yes" : "No") : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">Model metadata</h3>
                  <p className="text-sm text-muted-foreground">Quick facts about the selected model.</p>
                </div>
              </div>

              {activeModel ? (
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2">
                    <span className="text-muted-foreground">Model type</span>
                    <span className="font-medium text-foreground">{activeModel.model_type}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2">
                    <span className="text-muted-foreground">Task type</span>
                    <span className="font-medium text-foreground">{activeModel.task_type}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2">
                    <span className="text-muted-foreground">Target column</span>
                    <span className="font-medium text-foreground">{activeModel.target_column || "Unknown"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2">
                    <span className="text-muted-foreground">Saved file</span>
                    <span className="font-medium text-foreground">{activeModel.filename}</span>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Select a trained model to see details here.</p>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">How to use</h3>
                  <p className="text-sm text-muted-foreground">Keep the feature columns aligned with training.</p>
                </div>
              </div>

              <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>1. Choose a downloaded model from the list.</li>
                <li>2. Upload a CSV or JSON file with the same feature columns.</li>
                <li>3. Select the actual target column if you want evaluation metrics.</li>
                <li>4. Run the test and review the prediction preview.</li>
              </ol>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
