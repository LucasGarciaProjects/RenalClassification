"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle, 
  XCircle, 
  Brain, 
  FileImage, 
  File, 
  Download,
  ArrowLeft,
  TrendingUp,
  Activity,
  Eye,
  Target,
  Zap
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface ResultsProps {
  analysisData: any
  onBack: () => void
}

export function Results({ analysisData, onBack }: ResultsProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadReport = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kidney_analysis_report_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Report downloaded successfully!')
    } catch (error) {
      console.error('Error downloading report:', error)
      toast.error('Error generating report. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const getModelDisplayName = (model: string) => {
    const modelNames: { [key: string]: string } = {
      'mobilenet': 'MobileNetV2 (Fine-tuned)',
      'efficientnet': 'EfficientNetB0 (Fine-tuned)',
      'resnet': 'ResNet (Fine-tuned)'
    }
    return modelNames[model] || model
  }

  const getClassificationColor = (classification: string) => {
    return classification === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getClassificationIcon = (classification: string) => {
    return classification === 'healthy' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  // Extraer datos de forma segura
  const confidence = analysisData.confidence || 0
  const rawPrediction = analysisData.raw_prediction || 0
  const classification = analysisData.class || 'unknown'
  const originalImage = analysisData.original_image || null
  const maskedImage = analysisData.masked_image || null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Prediction Results</h1>
        </div>
        <Button 
          onClick={handleDownloadReport}
          disabled={isDownloading}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? 'Generating...' : 'Download Report'}
        </Button>
      </div>

      {/* Prediction Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Classification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getClassificationIcon(classification)}
              <Badge className={getClassificationColor(classification)}>
                {classification === 'healthy' ? 'Healthy' : 'Pathological'}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {(confidence * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Confidence</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Model Used</div>
            <div className="font-medium">{getModelDisplayName(analysisData.model)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Image Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            Image Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Original Image</div>
              {originalImage ? (
                <img 
                  src={`data:${analysisData.original_image_mime || 'image/jpeg'};base64,${originalImage}`}
                  alt="Original ultrasound image"
                  className="w-full h-64 object-contain rounded-lg border bg-gray-50"
                />
              ) : (
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                  No image available
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Masked Region</div>
              {maskedImage ? (
                <img 
                  src={`data:image/png;base64,${maskedImage}`}
                  alt="Masked ultrasound image"
                  className="w-full h-64 object-contain rounded-lg border bg-gray-50"
                />
              ) : (
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                  No masked image available
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Analysis Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-medium">Analysis Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Analysis Date:</span>
                <span>{formatDate(analysisData.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Model Architecture:</span>
                <span>{getModelDisplayName(analysisData.model)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Raw Prediction:</span>
                <span>{rawPrediction.toFixed(4)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Interpretation</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              The model analyzed the ultrasound image and classified it as{' '}
              <span className="font-medium">
                {classification === 'healthy' ? 'healthy' : 'pathological'}
              </span>{' '}
              with {(confidence * 100).toFixed(1)}% confidence.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              The analysis focused on the masked region of interest to provide accurate classification results.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
