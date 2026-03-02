"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import type { AnalysisData } from "@/app/page"
import { Brush, Eraser, RotateCcw, Save } from "lucide-react"

interface MaskEditorProps {
  onNext: () => void
  onBack: () => void
  onDataUpdate: (data: Partial<AnalysisData>) => void
  onError: (error: string) => void
  analysisData: AnalysisData
}

export function MaskEditor({ onNext, onBack, onDataUpdate, onError, analysisData }: MaskEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(10)
  const [tool, setTool] = useState<"brush" | "eraser">("brush")
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Configurar canvas
    canvas.width = 600
    canvas.height = 400

    // Cargar imagen de fondo
    const loadImage = () => {
      try {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          setImageLoaded(true)
        }
        img.onerror = () => {
          onError("No se pudo cargar la imagen. Usando canvas vacío para edición.")
          ctx.fillStyle = "#f3f4f6"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.fillStyle = "#6b7280"
          ctx.font = "16px Arial"
          ctx.textAlign = "center"
          ctx.fillText("Imagen no disponible - Modo simulación", canvas.width / 2, canvas.height / 2)
          setImageLoaded(true)
        }

        // Intentar cargar la imagen
        if (analysisData.image instanceof File) {
          const reader = new FileReader()
          reader.onload = (e) => {
            img.src = e.target?.result as string
          }
          reader.onerror = () => {
            img.src = "/placeholder.svg?height=400&width=600&text=Imagen+Simulada"
          }
          reader.readAsDataURL(analysisData.image)
        } else if (typeof analysisData.image === "string") {
          img.src = analysisData.image
        } else {
          img.src = "/placeholder.svg?height=400&width=600&text=Imagen+Simulada"
        }
      } catch (error) {
        onError("Error al cargar la imagen en el editor.")
        setImageLoaded(true)
      }
    }

    loadImage()
  }, [analysisData.image, onError])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.globalCompositeOperation = tool === "brush" ? "source-over" : "destination-out"
    ctx.beginPath()
    ctx.arc(x, y, brushSize / 2, 0, 2 * Math.PI)
    ctx.fillStyle = tool === "brush" ? "rgba(59, 130, 246, 0.5)" : "transparent"
    ctx.fill()
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Recargar imagen de fondo
    if (analysisData.image) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      img.onerror = () => {
        ctx.fillStyle = "#f3f4f6"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      if (analysisData.image instanceof File) {
        const reader = new FileReader()
        reader.onload = (e) => {
          img.src = e.target?.result as string
        }
        reader.readAsDataURL(analysisData.image)
      } else {
        img.src = analysisData.image as string
      }
    }
  }

  const saveMask = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      onError("No se pudo guardar la máscara. Continuando con máscara simulada.")
      onDataUpdate({
        mask: "/placeholder.svg?height=400&width=600&text=Máscara+Editada",
      })
      return
    }

    try {
      const dataURL = canvas.toDataURL("image/png")
      onDataUpdate({
        mask: dataURL,
      })
    } catch (error) {
      onError("Error al guardar la máscara. Usando máscara simulada.")
      onDataUpdate({
        mask: "/placeholder.svg?height=400&width=600&text=Máscara+Editada",
      })
    }
  }

  const handleNext = () => {
    saveMask()
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Editor de Máscara</h2>
        <p className="text-gray-600 dark:text-gray-300">Edite la máscara de segmentación según sea necesario</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Canvas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Área de Edición</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full h-auto cursor-crosshair"
                  style={{ maxHeight: "400px" }}
                />
              </div>
              {!imageLoaded && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Cargando imagen...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tools */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Herramientas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tool Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Herramienta</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={tool === "brush" ? "default" : "outline"}
                    onClick={() => setTool("brush")}
                    className="flex items-center gap-2"
                  >
                    <Brush className="w-4 h-4" />
                    Pincel
                  </Button>
                  <Button
                    variant={tool === "eraser" ? "default" : "outline"}
                    onClick={() => setTool("eraser")}
                    className="flex items-center gap-2"
                  >
                    <Eraser className="w-4 h-4" />
                    Borrador
                  </Button>
                </div>
              </div>

              {/* Brush Size */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Tamaño: {brushSize}px</Label>
                <Slider
                  value={[brushSize]}
                  onValueChange={(value) => setBrushSize(value[0])}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button variant="outline" onClick={clearCanvas} className="w-full flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Limpiar
                </Button>
                <Button variant="outline" onClick={saveMask} className="w-full flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Guardar Máscara
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Instrucciones</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <p>
                • Use el <strong>pincel</strong> para marcar áreas de interés
              </p>
              <p>
                • Use el <strong>borrador</strong> para corregir errores
              </p>
              <p>
                • Ajuste el <strong>tamaño</strong> según la precisión necesaria
              </p>
              <p>• La máscara se guarda automáticamente al continuar</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button onClick={handleNext} className="medical-button-primary">
          Continuar al Análisis
        </Button>
      </div>
    </div>
  )
}
