"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { AnalysisData } from "@/app/page"
import { CheckCircle, AlertTriangle, ImageIcon, Layers } from "lucide-react"
import Image from "next/image"

interface ConfirmationProps {
  onNext: () => void
  onBack: () => void
  onDataUpdate: (data: Partial<AnalysisData>) => void
  onError: (error: string) => void
  analysisData: AnalysisData
  selectedModel: string
}

export function Confirmation({
  onNext,
  onBack,
  onDataUpdate,
  onError,
  analysisData,
  selectedModel,
}: ConfirmationProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const runRealAnalysis = async () => {
    const formData = new FormData();
    formData.append('image', analysisData.image as File);
    formData.append('mask', analysisData.mask as File);
    formData.append('model', selectedModel);
  
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });
  
    const result = await response.json();
    onDataUpdate({
      classification: result.classification,
      confidence: result.confidence,
      gradcamUrl: result.gradcam
    });
  };

  const getImageSrc = () => {
    if (analysisData.image instanceof File) {
      return URL.createObjectURL(analysisData.image)
    }
    return analysisData.image || "/placeholder.svg?height=300&width=400&text=Imagen+No+Disponible"
  }

  const getMaskSrc = () => {
    if (analysisData.mask instanceof File) {
      return URL.createObjectURL(analysisData.mask)
    }
    return analysisData.mask || "/placeholder.svg?height=300&width=400&text=Máscara+No+Disponible"
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Confirmación del Análisis</h2>
        <p className="text-gray-600 dark:text-gray-300">Revise los datos antes de proceder con la clasificación</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Imagen Original */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Imagen Original
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <Image
                src={getImageSrc() || "/placeholder.svg"}
                alt="Imagen de ultrasonido"
                width={400}
                height={300}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Estado:</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Cargada
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Máscara */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Máscara de Segmentación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <Image
                src={getMaskSrc() || "/placeholder.svg"}
                alt="Máscara de segmentación"
                width={400}
                height={300}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
              <Badge
                variant="secondary"
                className={analysisData.maskGenerated ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}
              >
                {analysisData.maskGenerated ? "Automática" : "Manual"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuración del Análisis */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Análisis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Modelo Seleccionado</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedModel.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Tipo de Análisis</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Clasificación Binaria</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Tiempo Estimado</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">2-5 segundos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advertencias */}
      {analysisData.errors && analysisData.errors.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="w-5 h-5" />
              Avisos del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
              {analysisData.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mt-3">
              El análisis continuará con datos simulados cuando sea necesario.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isProcessing}>
          Volver
        </Button>
        <Button onClick={runRealAnalysis} disabled={isProcessing}>
          {isProcessing ? "Analizando..." : "Ejecutar Análisis"}
        </Button>
      </div>
    </div>
  )
}
