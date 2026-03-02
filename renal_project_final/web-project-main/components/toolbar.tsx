"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { Brain, Download, Sun, Moon, Monitor, Settings, Info, ArrowLeft } from "lucide-react"
import type { AnalysisStep } from "@/app/page"

interface ToolbarProps {
  currentStep: AnalysisStep
  onBack?: () => void
  selectedModel?: string
  onModelChange?: (model: string) => void
  analysisData?: any
  onDownloadReport?: () => void
}

export function Toolbar({ 
  currentStep, 
  onBack, 
  selectedModel, 
  onModelChange,
  analysisData,
  onDownloadReport 
}: ToolbarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Mostrar los tres modelos disponibles
  const models = [
    { value: "mobilenet", label: "MobileNetV2 (Fine-tuned)" },
    { value: "efficientnet", label: "EfficientNetB0 (Fine-tuned)" },
    { value: "resnet", label: "ResNet (Fine-tuned)" }
  ]

  if (!mounted) {
    return null
  }

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-4">
        {currentStep !== "upload" && onBack && (
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          <span className="font-semibold">Kidney Analysis</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Model Selection */}
        {currentStep === "upload" && onModelChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Model:</span>
            <Select value={selectedModel} onValueChange={onModelChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Download Report Button */}
        {currentStep === "results" && analysisData && onDownloadReport && (
          <Button 
            onClick={onDownloadReport}
            className="flex items-center gap-2"
            disabled={!analysisData.prediction}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download Report</span>
          </Button>
        )}

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>System</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
