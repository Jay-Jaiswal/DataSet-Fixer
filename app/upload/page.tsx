"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, FileText } from "lucide-react"
import { Header } from "@/components/header"
import { FileUploader } from "@/components/file-uploader"
import { DataPreviewTable } from "@/components/data-preview-table"
import { DatasetIssues } from "@/components/dataset-issues"
import { Button } from "@/components/ui/button"
import { useFileStore } from "@/components/file-store-provider"
import { useRouter } from "next/navigation"

export default function UploadPage() {
  const { uploadedFile, setUploadedFile } = useFileStore()
  const [localFile, setLocalFile] = useState<File | null>(uploadedFile)
  const [generatingReport, setGeneratingReport] = useState(false)
  const router = useRouter()

  const handleFileSelect = (file: File) => {
    setLocalFile(file)
    setUploadedFile(file)
  }

  const handleProceedToClean = () => {
    if (localFile) {
      setUploadedFile(localFile)
      router.push('/clean')
    }
  }

  const generateProfileReport = async () => {
    if (!localFile) return

    setGeneratingReport(true)
    try {
      const formData = new FormData()
      formData.append('file', localFile)

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
      a.download = `profile_report_${localFile.name.split('.')[0]}.html`
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

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <h1 className="mb-2 text-3xl font-bold text-foreground">Upload Dataset</h1>
          <p className="text-muted-foreground">
            Start by uploading your CSV or JSON file to begin the data cleaning and analysis process.
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-12">
          <FileUploader onFileSelect={handleFileSelect} />
        </div>

        {/* Data Preview */}
        {localFile && (
          <>
            <div className="mb-8">
              <DataPreviewTable file={localFile} />
            </div>

            {/* Dataset Issues */}
            <div className="mb-8">
              <DatasetIssues file={localFile} />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => { setLocalFile(null); setUploadedFile(null); }}>
                Upload Different File
              </Button>

              <Button variant="outline" onClick={generateProfileReport} disabled={generatingReport} className="gap-2">
                {generatingReport ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>

              <Button className="gap-2" onClick={handleProceedToClean}>
                Proceed to Cleaning
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
