'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, FileImage, File } from 'lucide-react';
import { toast } from 'sonner';

interface PredictionResult {
  class: string;
  confidence: number;
  raw_prediction: number;
  grad_cam?: string;
}

export default function FileUpload() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [maskFile, setMaskFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState('mobilenet');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PredictionResult | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('La imagen debe ser menor a 1MB');
        return;
      }
      setImageFile(file);
    }
  };

  const handleMaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('La máscara debe ser menor a 1MB');
        return;
      }
      setMaskFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!imageFile || !maskFile) {
      toast.error('Por favor selecciona una imagen y una máscara');
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('mask', maskFile);
      formData.append('model', selectedModel);

      const response = await fetch('/api/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la predicción');
      }

      const result = await response.json();
      setResults(result);
      toast.success('Predicción completada exitosamente');

    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al procesar la predicción');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Análisis de Imágenes Ecográficas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selector de Modelo */}
          <div className="space-y-2">
            <Label htmlFor="model">Modelo de IA</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobilenet">MobileNetV2</SelectItem>
                <SelectItem value="efficientnet">EfficientNetB0</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upload de Imagen */}
          <div className="space-y-2">
            <Label htmlFor="image">Imagen Ecográfica</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label htmlFor="image" className="cursor-pointer">
                <FileImage className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {imageFile ? imageFile.name : 'Haz clic para seleccionar imagen'}
                </p>
              </label>
            </div>
          </div>

          {/* Upload de Máscara */}
          <div className="space-y-2">
            <Label htmlFor="mask">Archivo Máscara (.mat)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                id="mask"
                type="file"
                accept=".mat"
                onChange={handleMaskChange}
                className="hidden"
              />
              <label htmlFor="mask" className="cursor-pointer">
                <File className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {maskFile ? maskFile.name : 'Haz clic para seleccionar archivo .mat'}
                </p>
              </label>
            </div>
          </div>

          {/* Botón de Predicción */}
          <Button 
            onClick={handleSubmit} 
            disabled={!imageFile || !maskFile || isLoading}
            className="w-full"
          >
            {isLoading ? 'Procesando...' : 'Realizar Predicción'}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de la Predicción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Clasificación</Label>
                <div className={`p-3 rounded-lg font-semibold ${
                  results.class === 'sano' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {results.class === 'sano' ? 'Sano' : 'Patológico'}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Confianza</Label>
                <div className="p-3 bg-blue-100 text-blue-800 rounded-lg font-semibold">
                  {(results.confidence * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Grad-CAM */}
            {results.grad_cam && (
              <div className="space-y-2">
                <Label>Mapa de Activación (Grad-CAM)</Label>
                <div className="border rounded-lg p-4">
                  <img 
                    src={`data:image/png;base64,${results.grad_cam}`}
                    alt="Grad-CAM visualization"
                    className="w-full max-w-md mx-auto"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 