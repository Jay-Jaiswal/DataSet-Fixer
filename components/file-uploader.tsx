"use client"

import { useCallback, useState, useEffect } from "react"
import { Upload, FileText, CheckCircle2 } from "lucide-react"

interface FileUploaderProps {
    onFileSelect: (file: File) => void
    initialFile?: File | null
}

export function FileUploader({ onFileSelect, initialFile }: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(initialFile || null)

    useEffect(() => {
        setSelectedFile(initialFile || null)
    }, [initialFile])

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true)
        } else if (e.type === "dragleave") {
            setIsDragging(false)
        }
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(false)

            const files = e.dataTransfer.files
            if (files && files[0]) {
                const file = files[0]
                if (file.type === "text/csv" || file.type === "application/json" || file.name.endsWith(".csv") || file.name.endsWith(".json")) {
                    setSelectedFile(file)
                    onFileSelect(file)
                } else {
                    alert("Please upload a CSV or JSON file")
                }
            }
        },
        [onFileSelect]
    )

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (files && files[0]) {
                const file = files[0]
                if (file.type === "text/csv" || file.type === "application/json" || file.name.endsWith(".csv") || file.name.endsWith(".json")) {
                    setSelectedFile(file)
                    onFileSelect(file)
                } else {
                    alert("Please upload a CSV or JSON file")
                }
            }
        },
        [onFileSelect]
    )

    return (
        <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-lg border-2 border-dashed transition-all ${isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
                }`}
        >
            <input
                type="file"
                id="file-upload"
                accept=".csv,.json"
                onChange={handleFileInput}
                className="absolute inset-0 z-10 cursor-pointer opacity-0"
            />

            <div className="flex flex-col items-center justify-center px-6 py-12">
                {selectedFile ? (
                    <>
                        <CheckCircle2 className="mb-4 h-12 w-12 text-green-500" />
                        <h3 className="mb-2 text-lg font-semibold text-foreground">File Selected</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>{selectedFile.name}</span>
                            <span className="text-xs">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                        </div>
                        <label
                            htmlFor="file-upload"
                            className="mt-4 cursor-pointer text-sm text-primary hover:underline"
                        >
                            Choose a different file
                        </label>
                    </>
                ) : (
                    <>
                        <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold text-foreground">
                            Upload your dataset
                        </h3>
                        <p className="mb-4 text-center text-sm text-muted-foreground">
                            Drag and drop your CSV or JSON file here, or click to browse
                        </p>
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            Browse Files
                        </label>
                        <p className="mt-4 text-xs text-muted-foreground">
                            Supported formats: CSV, JSON (Max size: 100MB)
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}
