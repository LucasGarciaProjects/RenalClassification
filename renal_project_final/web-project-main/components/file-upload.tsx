"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileImage, File, AlertCircle } from "lucide-react"

interface FileUploadProps {
  onAnalysisComplete: (data: any) => void
  onAnalysisError: (error: string) => void
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
  selectedModel: string
}

export function FileUpload({ 
  onAnalysisComplete, 
  onAnalysisError, 
  isProcessing, 
  setIsProcessing,
  selectedModel 
}: FileUploadProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [maskFile, setMaskFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const imageInputRef = useRef<HTMLInputElement>(null)
  const maskInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setImageFile(file)
        setError(null)
      } else {
        setError('Please select a valid image file')
      }
    }
  }

  const handleMaskChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.name.endsWith('.mat')) {
        setMaskFile(file)
        setError(null)
      } else {
        setError('Please select a valid .mat file')
      }
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!imageFile || !maskFile) {
      setError('Please select both an image and a mask file')
      return
    }

    if (!selectedModel) {
      setError('Please select a model')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('mask', maskFile)
      formData.append('model', selectedModel)

      const response = await fetch('/api/predict', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process analysis')
      }

      const data = await response.json()
      onAnalysisComplete(data)
    } catch (error) {
      console.error('Analysis error:', error)
      onAnalysisError(error instanceof Error ? error.message : 'An error occurred during analysis')
    } finally {
      setIsProcessing(false)
    }
  }

  const clearFiles = () => {
    setImageFile(null)
    setMaskFile(null)
    setError(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
    if (maskInputRef.current) maskInputRef.current.value = ''
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Files
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image" className="flex items-center gap-2">
                <FileImage className="w-4 h-4" />
                Ultrasound Image
              </Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={imageInputRef}
                disabled={isProcessing}
              />
              {imageFile && (
                <p className="text-sm text-gray-600">
                  Selected: {imageFile.name}
                </p>
              )}
            </div>

            {/* Mask Upload */}
            <div className="space-y-2">
              <Label htmlFor="mask" className="flex items-center gap-2">
                <File className="w-4 h-4" />
                Mask File (.mat)
              </Label>
              <Input
                id="mask"
                type="file"
                accept=".mat"
                onChange={handleMaskChange}
                ref={maskInputRef}
                disabled={isProcessing}
              />
              {maskFile && (
                <p className="text-sm text-gray-600">
                  Selected: {maskFile.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={!imageFile || !maskFile || isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : 'Analyze Image'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={clearFiles}
              disabled={isProcessing}
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
