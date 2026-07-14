"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    <span className="font-bold text-xl">DataFixer AI</span>
                </Link>

                <div className="flex items-center gap-4">
                    <nav className="flex items-center space-x-6">
                        <Link
                            href="/upload"
                            className="text-sm font-medium transition-colors hover:text-primary"
                        >
                            Upload
                        </Link>
                        <Link
                            href="/clean"
                            className="text-sm font-medium transition-colors hover:text-primary"
                        >
                            Clean
                        </Link>
                        <Link
                            href="/train"
                            className="text-sm font-medium transition-colors hover:text-primary"
                        >
                            Train
                        </Link>
                        <Link
                            href="/test"
                            className="text-sm font-medium transition-colors hover:text-primary"
                        >
                            Test Model
                        </Link>
                    </nav>

                    <ThemeToggle />
                </div>
            </div>
        </header>
    )
}
