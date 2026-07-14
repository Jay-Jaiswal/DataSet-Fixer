"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, AlertTriangle, Copy, Zap, FileCheck, Info, FileText } from "lucide-react"
import { Header } from "@/components/header"
import { CleanlinessScore } from "@/components/cleanliness-score"
import { CleaningIssueCard } from "@/components/cleaning-issue-card"
import { FileUploader } from "@/components/file-uploader"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useFileStore } from "@/components/file-store-provider"
import { useRouter } from "next/navigation"

export default function CleanPage() {
  const { uploadedFile: contextFile, setCleanedFile, analysisData: contextAnalysis, setAnalysisData: setContextAnalysis } = useFileStore()
  const [score, setScore] = useState(87)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [cleaning, setCleaning] = useState(false)
  const [cleanedData, setCleanedData] = useState<any>(null)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (contextFile) {
      setUploadedFile(contextFile)
      if (!analysisData) {
        analyzeDataset(contextFile)
      }
    }
    if (contextAnalysis && !analysisData) {
      setAnalysisData(contextAnalysis)
    }
  }, [contextFile, contextAnalysis])

  const issues = [
    {
      title: "Missing Values",
      description: "Empty cells that need to be handled or imputed",
      icon: <AlertTriangle className="h-5 w-5" />,
      count: 12,
      color: "red" as const,
    },
    {
      title: "Duplicate Rows",
      description: "Exact or near-duplicate records in your dataset",
      icon: <Copy className="h-5 w-5" />,
      count: 5,
      color: "yellow" as const,
    },
    {
      title: "Outliers",
      description: "Statistical anomalies that may affect model training",
      icon: <Zap className="h-5 w-5" />,
      count: 3,
      color: "orange" as const,
    },
    {
      title: "Data Type Issues",
      description: "Incorrect column types that need standardization",
      icon: <FileCheck className="h-5 w-5" />,
      count: 2,
      color: "yellow" as const,
    },
  ]

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file)
    setError(null)
    await analyzeDataset(file)
  }

  const analyzeDataset = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:8000/api/upload-and-analyze/', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Analysis failed')
      }

      const data = await response.json()
      console.log('Backend response:', data)

      // Transform backend response to expected format
      const transformedData = {
        columns: Object.keys(data.report?.column_details || {}).map(colName => ({
          name: colName,
          dtype: data.report.column_details[colName].dtype,
          missing: data.report.column_details[colName].missing_values,
          unique: data.report.column_details[colName].unique_values,
        })),
        shape: [data.report?.overview?.rows || 0, data.report?.overview?.columns || 0],
        issues: {
          missing_values: data.report?.overview?.total_missing_values || 0,
          duplicates: data.report?.overview?.duplicate_rows || 0,
          outliers: Object.values(data.report?.column_details || {}).reduce((sum: number, col: any) => sum + (col.outlier_count || 0), 0),
          type_issues: Object.values(data.report?.column_details || {}).filter((col: any) => col.is_numeric_like).length,
        },
        recommendations: data.recommendations || []
      }

      setAnalysisData(transformedData)
      setContextAnalysis(transformedData)

      // Calculate accurate cleanliness score from backend data
      const cleanlinessScore = data.report?.overview?.cleanliness_percentage || 0
      setScore(Math.round(cleanlinessScore))
    } catch (err: any) {
      console.error('Analysis error:', err)
      setError(err.message || 'Failed to analyze dataset')
    }
  }

  const handleCleanData = async () => {
    if (!uploadedFile) return

    setCleaning(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('missing_threshold', '0.8')
      formData.append('fill_strategy', 'auto')

      const response = await fetch('http://localhost:8000/api/clean-file/', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Cleaning failed')

      const blob = await response.blob()
      setCleanedData({
        blob,
        filename: response.headers.get('Content-Disposition')?.split('filename=')[1] || 'cleaned_data.csv'
      })

      // Re-analyze cleaned data
      const cleanedFile = new File([blob], 'cleaned.csv', { type: 'text/csv' })
      setCleanedFile(cleanedFile)
      await analyzeDataset(cleanedFile)

      // Scroll to summary after cleaning completes
      setTimeout(() => {
        summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      console.error('Cleaning error:', err)
      setError('Failed to clean dataset')
    } finally {
      setCleaning(false)
    }
  }

  const handleDownload = () => {
    if (!cleanedData) return

    const url = URL.createObjectURL(cleanedData.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = cleanedData.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generateProfileReport = async () => {
    const fileToProfile = cleanedData ? new File([cleanedData.blob], 'cleaned.csv', { type: 'text/csv' }) : uploadedFile
    if (!fileToProfile) return

    setGeneratingReport(true)
    try {
      const formData = new FormData()
      formData.append('file', fileToProfile)

      const response = await fetch('http://localhost:8000/api/profile-report/', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `profile_report_${cleanedData ? 'cleaned' : 'original'}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate profile report. Please ensure the backend is running.')
    } finally {
      setGeneratingReport(false)
    }
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

          <h1 className="mb-3 text-4xl font-bold text-foreground">Clean Your Dataset</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Upload raw datasets, automatically clean them, and visualize data quality improvements. Handle missing
            values, duplicates, outliers, and data type issues in one place.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 animate-slide-up">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Upload Dataset Section */}
        <div className="mb-12 animate-slide-up" style={{ animationDelay: "50ms" }}>
          <h2 className="text-2xl font-semibold text-foreground mb-6">Upload Dataset</h2>
          <FileUploader onFileSelect={handleFileUpload} initialFile={uploadedFile} />

          {/* Change File Button */}
          {uploadedFile && (
            <div className="mt-4 flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <FileCheck className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-semibold text-foreground">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setUploadedFile(null)
                  setAnalysisData(null)
                  setCleanedData(null)
                  setError(null)
                }}
              >
                Change File
              </Button>
            </div>
          )}
        </div>

        {/* Dataset Overview Cards */}
        {uploadedFile && analysisData && (
          <div className="mb-8 grid gap-4 md:grid-cols-4 animate-slide-up" style={{ animationDelay: "100ms" }}>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Rows</span>
                <FileCheck className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-foreground">{analysisData.shape?.[0]?.toLocaleString() || 0}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Columns</span>
                <FileCheck className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-foreground">{analysisData.shape?.[1] || 0}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Missing Values</span>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-foreground">{analysisData.issues?.missing_values?.toLocaleString() || 0}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Duplicates</span>
                <Copy className="h-4 w-4 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-foreground">{analysisData.issues?.duplicates || 0}</p>
            </Card>
          </div>
        )}

        {/* Data Cleaning Summary Section */}
        {uploadedFile && analysisData && (
          <div ref={summaryRef} className="mb-12 animate-slide-up" style={{ animationDelay: "150ms" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Data Quality Score</h2>
            </div>
            <CleanlinessScore
              score={score}
              issuesFound={(analysisData?.issues?.missing_values || 0) + (analysisData?.issues?.duplicates || 0) + (analysisData?.issues?.outliers || 0)}
              autoFixed={analysisData?.issues?.missing_values || 0}
              needReview={(analysisData?.issues?.duplicates || 0) + (analysisData?.issues?.outliers || 0)}
            />
            {cleanedData && (
              <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-green-500 font-semibold">Dataset cleaned successfully! Quality score improved.</p>
              </div>
            )}
          </div>
        )}

        {/* Feature Overview Section */}
        {uploadedFile && analysisData && (
          <div className="mb-12 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Feature Overview</h2>
              <span className="text-sm text-muted-foreground">
                {analysisData.columns?.length || 0} columns analyzed
              </span>
            </div>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-6 py-3 text-left font-semibold text-foreground">Column Name</th>
                      <th className="px-6 py-3 text-left font-semibold text-foreground">Type</th>
                      <th className="px-6 py-3 text-center font-semibold text-foreground">Unique Values</th>
                      <th className="px-6 py-3 text-center font-semibold text-foreground">Missing</th>
                      <th className="px-6 py-3 text-left font-semibold text-foreground">Quality</th>
                      <th className="px-6 py-3 text-left font-semibold text-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {analysisData.columns?.map((col: any, idx: number) => {
                      const missingPercent = ((col.missing || 0) / (analysisData.shape?.[0] || 1) * 100)
                      const quality = missingPercent > 50 ? 'Poor' : missingPercent > 20 ? 'Fair' : missingPercent > 0 ? 'Good' : 'Excellent'
                      const qualityColor = missingPercent > 50 ? 'text-red-500' : missingPercent > 20 ? 'text-yellow-500' : missingPercent > 0 ? 'text-blue-500' : 'text-green-500'
                      const statusBg = missingPercent > 50 ? 'bg-red-500/10' : missingPercent > 20 ? 'bg-yellow-500/10' : missingPercent > 0 ? 'bg-blue-500/10' : 'bg-green-500/10'
                      const statusBorder = missingPercent > 50 ? 'border-red-500/20' : missingPercent > 20 ? 'border-yellow-500/20' : missingPercent > 0 ? 'border-blue-500/20' : 'border-green-500/20'

                      return (
                        <tr key={idx} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${missingPercent > 20 ? 'bg-red-500' : missingPercent > 0 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                              <span className="text-foreground font-medium">{col.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                              {col.dtype?.includes('int') ? 'Numeric' :
                                col.dtype?.includes('float') ? 'Decimal' :
                                  col.dtype?.includes('object') ? 'Text' :
                                    col.dtype?.includes('datetime') ? 'Date' : col.dtype}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-muted-foreground font-semibold">{col.unique?.toLocaleString() || 0}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-semibold ${missingPercent > 20 ? 'text-red-500' : missingPercent > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                                {col.missing || 0}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({missingPercent.toFixed(1)}%)
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className={`h-full rounded-full transition-all ${missingPercent > 50 ? 'bg-red-500' :
                                    missingPercent > 20 ? 'bg-yellow-500' :
                                      missingPercent > 0 ? 'bg-blue-500' : 'bg-green-500'
                                    }`}
                                  style={{ width: `${Math.max(10, 100 - missingPercent)}%` }}
                                />
                              </div>
                              <span className={`text-xs font-semibold ${qualityColor}`}>
                                {quality}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${statusBg} ${statusBorder} ${qualityColor}`}>
                              {missingPercent > 50 ? 'Needs Attention' :
                                missingPercent > 20 ? 'Review' :
                                  missingPercent > 0 ? 'Minor Issues' : 'Clean'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Issues Found Section */}
        {uploadedFile && analysisData && (
          <div className="mb-12 animate-slide-up" style={{ animationDelay: "250ms" }}>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Data Quality Issues</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  title: "Missing Values",
                  description: "Empty cells that need to be handled or imputed",
                  icon: <AlertTriangle className="h-5 w-5" />,
                  count: analysisData.issues?.missing_values || 0,
                  color: "red" as const,
                },
                {
                  title: "Duplicate Rows",
                  description: "Exact or near-duplicate records in your dataset",
                  icon: <Copy className="h-5 w-5" />,
                  count: analysisData.issues?.duplicates || 0,
                  color: "yellow" as const,
                },
                {
                  title: "Outliers",
                  description: "Statistical anomalies that may affect model training",
                  icon: <Zap className="h-5 w-5" />,
                  count: analysisData.issues?.outliers || 0,
                  color: "orange" as const,
                },
                {
                  title: "Data Type Issues",
                  description: "Incorrect column types that need standardization",
                  icon: <FileCheck className="h-5 w-5" />,
                  count: analysisData.issues?.type_issues || 0,
                  color: "yellow" as const,
                },
              ].map((issue, idx) => (
                <div key={issue.title} style={{ animationDelay: `${idx * 50}ms` }} className="animate-slide-up">
                  <CleaningIssueCard {...issue} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        {uploadedFile && analysisData && analysisData.recommendations?.length > 0 && (
          <div className="mb-12 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Recommendations</h2>
            <Card className="p-6">
              <div className="space-y-3">
                {analysisData.recommendations.map((rec: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="mt-0.5">
                      <Info className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="text-sm text-foreground">{rec}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Clean Dataset Button */}
        {uploadedFile && analysisData && !cleanedData && (
          <div className="mb-12 flex justify-center animate-slide-up" style={{ animationDelay: "350ms" }}>
            <Button onClick={handleCleanData} disabled={cleaning} size="lg" className="gap-2">
              {cleaning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Cleaning...
                </>
              ) : (
                <>
                  Clean Dataset
                </>
              )}
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        {cleanedData && (
          <div className="flex flex-col gap-3 sm:flex-row animate-slide-up" style={{ animationDelay: "350ms" }}>
            <Button
              variant="outline"
              className="sm:flex-1 bg-transparent gap-2"
              onClick={handleDownload}
            >
              <FileCheck className="h-4 w-4" />
              Download Cleaned CSV
            </Button>

            <Button
              variant="outline"
              className="sm:flex-1 bg-transparent gap-2"
              onClick={generateProfileReport}
              disabled={generatingReport}
            >
              {generatingReport ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Download Report
                </>
              )}
            </Button>

            <Button
              className="sm:flex-1 gap-2"
              onClick={() => {
                if (cleanedData) {
                  const cleanedFile = new File([cleanedData.blob], 'cleaned.csv', { type: 'text/csv' })
                  setCleanedFile(cleanedFile)
                }
                router.push('/train')
              }}
            >
              Proceed to Model Training
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
