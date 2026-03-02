"use client"

import { useState } from "react"
import { FileUpload } from "@/components/file-upload"
import { Results } from "@/components/results"
import { Toolbar } from "@/components/toolbar"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export type AnalysisStep = "upload" | "results"

export default function Home() {
  const [currentStep, setCurrentStep] = useState<AnalysisStep>("upload")
  const [analysisData, setAnalysisData] = useState<any>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>("mobilenet")

  const handleAnalysisComplete = (data: any) => {
    console.log('Analysis completed, received data:', data);
    setAnalysisData(data)
    setCurrentStep("results")
    setIsProcessing(false)
    setError(null)
  }

  const handleAnalysisError = (errorMessage: string) => {
    console.error('Analysis error:', errorMessage);
    setError(errorMessage)
    setIsProcessing(false)
  }

  const handleBack = () => {
    setCurrentStep("upload")
    setAnalysisData({})
    setError(null)
  }

  const handleModelChange = (model: string) => {
    setSelectedModel(model)
  }

  const handleDownloadReport = async () => {
    // This will be handled by the Results component
    console.log('Download report requested')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar 
        currentStep={currentStep}
        onBack={handleBack}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
        analysisData={analysisData}
        onDownloadReport={handleDownloadReport}
      />
      
      <main className="container mx-auto px-4 py-8">
        {currentStep === "upload" && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Kidney Ultrasound Analysis
              </h1>
              <p className="text-gray-600">
                Upload ultrasound images and masks for automated analysis
              </p>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <FileUpload
              onAnalysisComplete={handleAnalysisComplete}
              onAnalysisError={handleAnalysisError}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              selectedModel={selectedModel}
            />

            {isProcessing && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Processing Analysis</h3>
                  <p className="text-gray-600 mb-4">
                    Please wait while we analyze your ultrasound image...
                  </p>
                </div>
                <Progress value={undefined} className="w-full" />
              </div>
            )}
          </div>
        )}

        {currentStep === "results" && (
          <Results 
            analysisData={analysisData} 
            onBack={handleBack} 
          />
        )}
      </main>
    </div>
  )
}
