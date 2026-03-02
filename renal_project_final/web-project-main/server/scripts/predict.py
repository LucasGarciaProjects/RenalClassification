import os
import sys
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import cv2
from scipy.io import loadmat
import base64
from datetime import datetime
import time
from PIL import Image
from io import BytesIO
import scipy.io

# Configure TensorFlow to suppress messages and optimize performance
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'
tf.get_logger().setLevel('ERROR')

# Configuration
IMG_SIZE = (224, 224)
MODELS = {
    "mobilenet": "model_finetune_3.keras",
    "efficientnet": "efficientnetb0_finetuned.keras",
    "resnet": "model_finetune_resnet.keras"
}
MODEL_CACHE = {}

# Global variable to store the model
_models = {}

def load_model_cached(model_type):
    """Load model with caching to avoid reloading"""
    if model_type not in _models:
        # Buscar el modelo en la carpeta raíz del proyecto
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(script_dir))  # Subir dos niveles desde server/scripts/
        model_path = os.path.join(project_root, "models", MODELS[model_type])
        
        if not os.path.exists(model_path):
            raise ValueError(f"Model not found: {model_path}")
        
        print(f"Loading model: {model_path}", file=sys.stderr)
        _models[model_type] = load_model(model_path, compile=False)
        print(f"Model loaded successfully", file=sys.stderr)
    
    return _models[model_type]

def preprocess_image(image_path, mask_path):
    """Preprocess image with mask application"""
    try:
        # Load image and mask
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError(f"Could not load image from {image_path}")
        
        mask_data = loadmat(mask_path)
        mask = mask_data['mask']
        
        # Crop using mask
        coords = np.argwhere(mask)
        if len(coords) == 0:
            raise ValueError("Mask is empty")
            
        y0, x0 = coords.min(axis=0)
        y1, x1 = coords.max(axis=0) + 1
        img_cropped = img[y0:y1, x0:x1]
        
        # Resize and convert to RGB
        img_resized = cv2.resize(img_cropped, IMG_SIZE)
        img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_GRAY2RGB)
        
        # Normalize to [-1, 1]
        img_normalized = img_rgb.astype(np.float32) / 127.5 - 1
        
        return img_normalized, img_rgb  # Return RGB version for display
        
    except Exception as e:
        raise ValueError(f"Error preprocessing image: {str(e)}")

def predict(image_path, mask_path, model_type):
    """Perform prediction with the selected model"""
    try:
        print(f"Starting prediction with model: {model_type}", file=sys.stderr)
        
        # Load model
        model = load_model_cached(model_type)
        
        print("Preprocessing image...", file=sys.stderr)
        # Preprocess image
        img_normalized, img_rgb = preprocess_image(image_path, mask_path)
        img_batch = np.expand_dims(img_normalized, axis=0)
        
        print("Running prediction...", file=sys.stderr)
        # Perform prediction
        pred = model.predict(img_batch, verbose=0)
        raw_prediction = float(pred[0][0])
        
        print(f"Raw prediction: {raw_prediction}", file=sys.stderr)
        
        # Determine class and confidence
        if raw_prediction < 0.5:
            class_label = "healthy"
            confidence = 1 - raw_prediction
        else:
            class_label = "pathological"
            confidence = raw_prediction
        
        # INVERTIR ETIQUETAS SOLO PARA EFFICIENTNET Y RESNET
        if model_type in ["efficientnet", "resnet"]:
            print(f"Inverting labels for {model_type} model", file=sys.stderr)
            if class_label == "healthy":
                class_label = "pathological"
            else:
                class_label = "healthy"
            # La confianza se mantiene igual, solo cambiamos la etiqueta
        
        print("Converting images to base64...", file=sys.stderr)
        # Convert images to base64
        def image_to_base64(img):
            _, buffer = cv2.imencode('.png', img)
            return base64.b64encode(buffer).decode('utf-8')
        
        # Original image (RGB version)
        original_image_b64 = image_to_base64(img_rgb)
        
        # Create masked image (apply mask overlay)
        masked_img = img_rgb.copy()
        # Add a subtle green overlay to show the masked region
        overlay = np.zeros_like(img_rgb)
        overlay[:, :, 1] = 50  # Green channel
        masked_img = cv2.addWeighted(masked_img, 0.8, overlay, 0.2, 0)
        masked_image_b64 = image_to_base64(masked_img)
        
        print("Prediction completed successfully", file=sys.stderr)
        
        return {
            "class": class_label,
            "confidence": float(confidence),
            "raw_prediction": raw_prediction,
            "original_image": original_image_b64,
            "masked_image": masked_image_b64,
            "model": model_type,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise ValueError(f"Error during prediction: {str(e)}")

if __name__ == "__main__":
    try:
        if len(sys.argv) != 4:
            print(json.dumps({"error": "Invalid number of arguments"}))
            sys.exit(1)
            
        image_path = sys.argv[1]
        mask_path = sys.argv[2]
        model_type = sys.argv[3]
        
        if model_type not in MODELS:
            print(json.dumps({"error": f"Invalid model type: {model_type}"}))
            sys.exit(1)
        
        # Change to script directory to find models
        script_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(script_dir)
        
        print(f"Working directory: {os.getcwd()}", file=sys.stderr)
        print(f"Model path: {os.path.join('models', MODELS[model_type])}", file=sys.stderr)
        
        # Perform prediction
        result = predict(image_path, mask_path, model_type)
        
        # Output JSON result
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1) 