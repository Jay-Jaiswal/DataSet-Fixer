"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, FileCheck, PlayCircle, AlertCircle, Brain, Database, FileText } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

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
  const [uploadedModel, setUploadedModel] = useState<File | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [targetColumn, setTargetColumn] = useState("")
  const [loadingFile, setLoadingFile] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const handleModelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedModel(file)
    setResult(null)
    setError(null)
  }

  const handleTestModel = async () => {
    if (!uploadedFile) {
      setError("Please upload a dataset to test the model")
      return
    }

    if (!uploadedModel) {
      setError("Please upload a trained model file")
      return
    }

    setTesting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", uploadedFile)
      formData.append("model_file", uploadedModel)

      if (targetColumn) {
        formData.append("target_column", targetColumn)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/test-model/`, {
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
            Upload a saved model and fresh data, then compare predictions with your actual target column if
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
                  <h2 className="text-2xl font-semibold text-foreground">Upload trained model</h2>
                  <p className="text-sm text-muted-foreground">Choose the .pkl or .joblib model file you downloaded after training.</p>
                </div>
              </div>

              <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center hover:border-primary/50 transition-colors">
                <input type="file" accept=".pkl,.joblib" className="hidden" id="trained-model-input" onChange={handleModelUpload} disabled={testing} />
                <label htmlFor="trained-model-input" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <Brain className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">Drop your model here</p>
                      <p className="text-sm text-muted-foreground">or click to browse for a .pkl or .joblib file</p>
                    </div>
                  </div>
                </label>
              </div>

              {uploadedModel && (
                <div className="mt-4 rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <FileCheck className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="font-semibold text-foreground">{uploadedModel.name}</p>
                        <p className="text-sm text-muted-foreground">{(uploadedModel.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setUploadedModel(null)}>Change Model</Button>
                  </div>
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

                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={handleTestModel} disabled={testing || !uploadedFile || !uploadedModel}>
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

              {uploadedModel ? (
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2">
                    <span className="text-muted-foreground">Uploaded file</span>
                    <span className="max-w-[12rem] truncate font-medium text-foreground">{uploadedModel.name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-medium text-foreground">{(uploadedModel.size / 1024).toFixed(2)} KB</span>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Upload a model file to see its details here.</p>
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
                <li>1. Upload the model file you downloaded after training.</li>
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
