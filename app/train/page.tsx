"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Upload, FileCheck, AlertCircle } from "lucide-react"
import { Header } from "@/components/header"
import { TrainingForm } from "@/components/training-form"
import { ModelResults } from "@/components/model-results"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFileStore } from "@/components/file-store-provider"

export default function TrainPage() {
  const { cleanedFile, uploadedFile: contextUploadedFile } = useFileStore()
  const fileToUse = cleanedFile || contextUploadedFile
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)
  const [trainingResults, setTrainingResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (fileToUse) {
      handleFileLoad(fileToUse)
    }
  }, [fileToUse])

  const handleFileLoad = async (file: File) => {
    setUploadedFile(file)
    setError(null)
    setLoading(true)

    try {
      const text = await file.text()
      const lines = text.trim().split('\n').filter(line => line.trim())

      if (lines.length > 0) {
        // Parse CSV headers
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
        setColumns(headers)
        console.log('Loaded columns:', headers)
      }
    } catch (err) {
      console.error('Error reading file:', err)
      setError('Failed to read file')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setLoading(true)

    try {
      // Read file to extract column names
      const text = await file.text()

      if (file.name.endsWith('.csv')) {
        const lines = text.trim().split('\n')
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
        setColumns(headers)
      } else if (file.name.endsWith('.json')) {
        const jsonData = JSON.parse(text)
        const arrayData = Array.isArray(jsonData) ? jsonData : [jsonData]
        if (arrayData.length > 0) {
          setColumns(Object.keys(arrayData[0]))
        }
      }

      setUploadedFile(file)
    } catch (err) {
      setError('Failed to read file. Please ensure it\'s a valid CSV or JSON file.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleTrain = async (config: any) => {
    if (!uploadedFile) {
      setError('Please upload a dataset first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('target_column', config.targetColumn)
      formData.append('feature_columns', JSON.stringify(columns.filter(col => col !== config.targetColumn)))
      formData.append('task_type', config.taskType || 'classification')
      formData.append('model_type', config.algorithm)
      formData.append('test_size', String(config.testSize / 100))
      formData.append('random_state', String(config.randomState))
      formData.append('model_params', JSON.stringify({}))

      const response = await fetch('http://localhost:8000/api/train-model/', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Training failed')
      }

      const result = await response.json()
      console.log('Training result:', result)
      setTrainingResults(result)
      setShowResults(true)
    } catch (err) {
      setError('Training failed. Please check your dataset and try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setUploadedFile(null)
    setColumns([])
    setShowResults(false)
    setTrainingResults(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-12 animate-slide-up">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <h1 className="mb-3 text-4xl font-bold text-foreground">Train Your Model</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Configure machine learning parameters and train your model with automated optimization. Select your target
            column, choose an algorithm, and adjust hyperparameters to fit your needs.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-slide-up">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-500">Error</h3>
              <p className="text-sm text-red-500/90">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="space-y-8">
          {/* Upload Cleaned Dataset Section */}
          {!showResults && (
            <>
              <Card className="p-8 border-2 border-dashed border-primary/30 bg-card/50 animate-slide-up">
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold text-foreground mb-2">Upload Cleaned Dataset</h2>
                  <p className="text-muted-foreground">Select your cleaned CSV or JSON file to begin training</p>
                </div>

                {!uploadedFile ? (
                  <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept=".csv,.json"
                      className="hidden"
                      id="dataset-input"
                      onChange={handleFileUpload}
                      disabled={loading}
                    />
                    <label htmlFor="dataset-input" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-3">
                        <Upload className="h-12 w-12 text-muted-foreground" />
                        <div>
                          <p className="font-semibold text-foreground">
                            {loading ? 'Loading...' : 'Drop your dataset here'}
                          </p>
                          <p className="text-sm text-muted-foreground">or click to browse</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Supported formats: CSV, JSON (Max size: 100MB)
                        </p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileCheck className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="font-semibold text-foreground">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(uploadedFile.size / 1024).toFixed(2)} KB • {columns.length} columns
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={resetForm}>
                        Change File
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Model Configuration Section */}
              {uploadedFile && columns.length > 0 && (
                <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
                  <h2 className="text-2xl font-semibold text-foreground mb-6">Model Configuration</h2>
                  <TrainingForm
                    onTrain={handleTrain}
                    columns={columns}
                    loading={loading}
                  />
                </div>
              )}
            </>
          )}

          {/* Results Section */}
          {showResults && (
            <div className="animate-fade-in">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">Training Results</h2>
                  <p className="text-muted-foreground">
                    View comprehensive metrics and visualizations from your trained model
                  </p>
                </div>
                <Button variant="outline" onClick={resetForm}>
                  Train Another Model
                </Button>
              </div>
              <ModelResults isVisible={showResults} results={trainingResults} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
