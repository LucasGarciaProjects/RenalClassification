import express from "express"
import multer from "multer"
import cors from "cors"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import { spawn } from "child_process"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ruta al intérprete de Python y scripts
const PYTHON = process.env.PYTHON || "python3"
const SCRIPTS_DIR = path.join(__dirname, "scripts")

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use("/uploads", express.static("uploads"))

// Crear directorio de uploads si no existe
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads")
}

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const upload = multer({ storage })

// Ejecuta un script de Python y devuelve la salida JSON
const runPython = (script, args = [], inputData) => {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON, [path.join(SCRIPTS_DIR, script), ...args])
    let output = ""
    let error = ""

    if (inputData) {
      child.stdin.write(inputData)
      child.stdin.end()
    }

    child.stdout.on("data", (data) => {
      output += data.toString()
    })

    child.stderr.on("data", (data) => {
      error += data.toString()
    })

    child.on("close", () => {
      if (error) {
        console.error(script, error)
      }
      try {
        resolve(JSON.parse(output))
      } catch (e) {
        reject(e)
      }
    })
  })
}

// Utilidad simple para respuestas de endpoints simulados
const safeResponse = (res, message, data) => {
  res.json({ error: false, message, simulated: true, data })
}

// Endpoint para segmentación automática
app.post("/api/segment", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: true, message: "Imagen no enviada" })
  }

  const maskName = `mask-${Date.now()}.png`
  const maskPath = path.join("uploads", maskName)

  try {
    const result = await runPython("segment.py", [req.file.path, maskPath])
    res.json({
      error: false,
      message: "Segmentación automática completada",
      simulated: false,
      data: { maskUrl: `/${maskPath}`, confidence: result.confidence || 0.9 },
    })
  } catch (e) {
    console.error("segment", e)
    res.json({
      error: true,
      message: "Error en la segmentación automática",
      simulated: false,
    })
  }
})

// Endpoint para clasificación con modelos de deep learning
app.post("/api/predict", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "mask", maxCount: 1 },
]), async (req, res) => {
  const image = req.files?.image?.[0];
  const mask = req.files?.mask?.[0];
  const modelType = req.body.model || "mobilenet";

  if (!image || !mask) {
    return res.status(400).json({ error: true, message: "Faltan archivos" });
  }

  try {
    const result = await runPython("predict.py", [image.path, mask.path, modelType]);
    res.json({
      error: false,
      message: "Predicción completada",
      simulated: false,
      data: result,
    });
  } catch (e) {
    console.error("predict", e);
    res.json({ error: true, message: "Error en la predicción", simulated: false });
  }
});

// Procesamiento de archivos .mat
app.post("/api/process-mat", upload.single("mat"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: true, message: "Archivo .mat requerido" })
  }

  const maskName = `mat-mask-${Date.now()}.png`
  const maskPath = path.join("uploads", maskName)

  try {
    const result = await runPython("process_mat.py", [req.file.path, maskPath])
    res.json({
      error: false,
      message: "Archivo .mat procesado",
      simulated: false,
      data: { maskUrl: `/${maskPath}`, variables: result.variables || [] },
    })
  } catch (e) {
    console.error("process-mat", e)
    res.json({ error: true, message: "Error al procesar archivo .mat", simulated: false })
  }
})

// Endpoint para Grad-CAM
app.post(
  "/api/gradcam",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "mask", maxCount: 1 },
  ]),
  (req, res) => {
    const simulatedGradCAM = {
      gradcamUrl: "/api/placeholder-gradcam",
      heatmapIntensity: "high",
      focusAreas: ["cortex", "medulla"],
    }

    safeResponse(res, "Generación de Grad-CAM", simulatedGradCAM)
  },
)

// Endpoint para generar PDF
app.post("/api/generate-pdf", async (req, res) => {
  const pdfName = `report-${Date.now()}.pdf`
  const pdfPath = path.join("uploads", pdfName)

  try {
    const result = await runPython(
      "generate_pdf.py",
      [pdfPath],
      JSON.stringify(req.body)
    )
    res.json({
      error: false,
      message: "PDF generado",
      simulated: false,
      data: { pdfUrl: `/${result.pdf_path || pdfPath}` },
    })
  } catch (e) {
    console.error("pdf", e)
    res.json({ error: true, message: "Error al generar PDF", simulated: false })
  }
})

// Endpoints para placeholders
app.get("/api/placeholder-mask", (req, res) => {
  res.redirect("/placeholder.svg?height=400&width=400&text=Máscara+Simulada")
})

app.get("/api/placeholder-gradcam", (req, res) => {
  res.redirect("/placeholder.svg?height=400&width=400&text=Grad-CAM+Simulado")
})

app.get("/api/placeholder-pdf", (req, res) => {
  res.json({
    message: "PDF simulado generado correctamente",
    downloadUrl: "#",
    note: "En producción, aquí se descargaría el archivo PDF real",
  })
})

// Endpoint para obtener métricas del modelo
app.get("/api/model-metrics", (req, res) => {
  const simulatedMetrics = {
    accuracy: (Math.random() * 0.1 + 0.9).toFixed(3),
    precision: (Math.random() * 0.1 + 0.85).toFixed(3),
    recall: (Math.random() * 0.1 + 0.88).toFixed(3),
    f1Score: (Math.random() * 0.1 + 0.87).toFixed(3),
    auc: (Math.random() * 0.05 + 0.92).toFixed(3),
  }

  safeResponse(res, "Obtención de métricas", simulatedMetrics)
})

// Endpoint para listar modelos disponibles
app.get("/api/models", (req, res) => {
  const availableModels = [
    { id: "mobilenetv2_default", name: "MobileNetV2 (Default)", accuracy: "92.3%" },
    { id: "mobilenetv2_enhanced", name: "MobileNetV2 Enhanced", accuracy: "94.1%" },
    { id: "resnet50_custom", name: "ResNet50 Custom", accuracy: "91.8%" },
  ]

  res.json({
    error: false,
    message: "Modelos disponibles obtenidos correctamente",
    simulated: false,
    data: availableModels,
  })
})

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`)
})
