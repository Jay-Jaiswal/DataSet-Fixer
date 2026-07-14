"use client"

import { useEffect, useState } from "react"
import { Table, FileText, Database } from "lucide-react"

interface DataPreviewTableProps {
    file: File
}

export function DataPreviewTable({ file }: DataPreviewTableProps) {
    const [data, setData] = useState<any[]>([])
    const [columns, setColumns] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadFileData = async () => {
            try {
                setLoading(true)
                setError(null)

                const text = await file.text()

                if (file.name.endsWith(".csv")) {
                    // Parse CSV
                    const lines = text.trim().split("\n")
                    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""))

                    const rows = lines.slice(1, Math.min(11, lines.length)).map(line => {
                        const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""))
                        const row: any = {}
                        headers.forEach((header, i) => {
                            row[header] = values[i] || ""
                        })
                        return row
                    })

                    setColumns(headers)
                    setData(rows)
                } else if (file.name.endsWith(".json")) {
                    // Parse JSON
                    const jsonData = JSON.parse(text)
                    const arrayData = Array.isArray(jsonData) ? jsonData : [jsonData]
                    const preview = arrayData.slice(0, 10)

                    if (preview.length > 0) {
                        const cols = Object.keys(preview[0])
                        setColumns(cols)
                        setData(preview)
                    }
                }
            } catch (err) {
                setError("Failed to parse file. Please ensure it's a valid CSV or JSON file.")
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        loadFileData()
    }, [file])

    if (loading) {
        return (
            <div className="rounded-lg border bg-card p-8">
                <div className="flex flex-col items-center justify-center">
                    <Database className="mb-4 h-12 w-12 animate-pulse text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading data preview...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
                <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-destructive" />
                    <div>
                        <h3 className="font-semibold text-destructive">Error Loading File</h3>
                        <p className="mt-1 text-sm text-destructive/90">{error}</p>
                    </div>
                </div>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="rounded-lg border bg-card p-8">
                <div className="flex flex-col items-center justify-center">
                    <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No data found in file</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Table className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Data Preview</h2>
                </div>
                <div className="text-sm text-muted-foreground">
                    Showing {data.length} of {data.length} rows
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border bg-card">
                <table className="w-full">
                    <thead className="border-b bg-muted/50">
                        <tr>
                            {columns.map((col, i) => (
                                <th
                                    key={i}
                                    className="px-4 py-3 text-left text-sm font-semibold text-foreground"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                {columns.map((col, j) => (
                                    <td key={j} className="px-4 py-3 text-sm text-muted-foreground">
                                        {String(row[col] || "")}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
                <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Columns:</span>
                        <span className="font-semibold">{columns.length}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Preview Rows:</span>
                        <span className="font-semibold">{data.length}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">File Size:</span>
                        <span className="font-semibold">{(file.size / 1024).toFixed(2)} KB</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
