"use client"

import { Upload, Zap, Brain, BarChart3 } from "lucide-react"
import { Header } from "@/components/header"
import { DashboardCard } from "@/components/dashboard-card"

export default function Home() {
  const cards = [
    {
      title: "Upload Dataset",
      description: "Drag and drop CSV or JSON files to get started with data cleaning.",
      icon: <Upload className="h-6 w-6" />,
      href: "/upload",
    },
    {
      title: "Clean Data",
      description: "Handle missing values, duplicates, outliers, and data type issues.",
      icon: <Zap className="h-6 w-6" />,
      href: "/clean",
    },
    {
      title: "Train Model",
      description: "Build and train ML models with customizable parameters and algorithms.",
      icon: <Brain className="h-6 w-6" />,
      href: "/train",
    },
    {
      title: "Test Model",
      description: "Upload new data, load a trained model, and review predictions and metrics.",
      icon: <BarChart3 className="h-6 w-6" />,
      href: "/test",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-20 text-center animate-slide-up">
          <h1 className="mb-6 text-5xl font-bold text-foreground sm:text-6xl lg:text-7xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            DataFixer AI Studio
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Upload, clean, and train your data effortlessly. A professional pipeline for data science, designed for
            beginners and experts alike.
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          {cards.map((card, idx) => (
            <div key={card.title} className="animate-slide-up" style={{ animationDelay: `${idx * 75}ms` }}>
              <DashboardCard title={card.title} description={card.description} icon={card.icon} href={card.href} />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
