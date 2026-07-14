"use client"

import * as React from "react"

type FileStoreContextType = {
    uploadedFile: File | null
    setUploadedFile: (file: File | null) => void
    cleanedFile: File | null
    setCleanedFile: (file: File | null) => void
    analysisData: any
    setAnalysisData: (data: any) => void
}

const FileStoreContext = React.createContext<FileStoreContextType | undefined>(undefined)

export function FileStoreProvider({ children }: { children: React.ReactNode }) {
    const [uploadedFile, setUploadedFile] = React.useState<File | null>(null)
    const [cleanedFile, setCleanedFile] = React.useState<File | null>(null)
    const [analysisData, setAnalysisData] = React.useState<any>(null)

    return (
        <FileStoreContext.Provider
            value={{
                uploadedFile,
                setUploadedFile,
                cleanedFile,
                setCleanedFile,
                analysisData,
                setAnalysisData,
            }}
        >
            {children}
        </FileStoreContext.Provider>
    )
}

export const useFileStore = () => {
    const context = React.useContext(FileStoreContext)
    if (context === undefined) {
        throw new Error("useFileStore must be used within a FileStoreProvider")
    }
    return context
}
