import os
import sys
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import cv2
from scipy.io import loadmat
import base64
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_preprocess

# Configuración
IMG_SIZE = (224, 224)
MODEL_MAP = {
    "mobilenet": "model_sin_aug.keras",
    "efficientnet": "model_sin_aug_efficientnet.keras"
}

def preprocess_image(image_path, mask_path):
    """Preprocesa la imagen usando la máscara"""
    try:
        # 1. Cargar imagen y máscara
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError(f"No se pudo cargar la imagen: {image_path}")
        
        mask_data = loadmat(mask_path)
        mask = mask_data['mask'] if 'mask' in mask_data else mask_data['data']
        
        # 2. Recortar usando máscara
        coords = np.argwhere(mask)
        if len(coords) == 0:
            raise ValueError("La máscara está vacía")
            
        y0, x0 = coords.min(axis=0)
        y1, x1 = coords.max(axis=0) + 1
        img_cropped = img[y0:y1, x0:x1]
        
        # 3. Preprocesamiento
        img_resized = cv2.resize(img_cropped, IMG_SIZE)
        img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_GRAY2RGB)
        
        return img_rgb
    except Exception as e:
        raise ValueError(f"Error en preprocesamiento: {str(e)}")

def generate_gradcam(model, img, layer_name=None):
    """Genera mapa Grad-CAM"""
    try:
        # Encontrar la última capa convolucional
        if layer_name is None:
            for layer in reversed(model.layers):
                if 'conv' in layer.name.lower():
                    layer_name = layer.name
                    break
        
        if layer_name is None:
            return None
            
        # Crear modelo para Grad-CAM
        grad_model = tf.keras.models.Model(
            [model.inputs], [model.get_layer(layer_name).output, model.output]
        )
        
        with tf.GradientTape() as tape:
            conv_outputs, predictions = grad_model(img)
            loss = predictions[:, 0]  # Asumiendo clasificación binaria
            
        # Calcular gradientes
        grads = tape.gradient(loss, conv_outputs)
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
        
        # Ponderar canales de características
        conv_outputs = conv_outputs[0]
        heatmap = tf.reduce_mean(tf.multiply(pooled_grads, conv_outputs), axis=-1)
        
        # Normalizar heatmap
        heatmap = tf.maximum(heatmap, 0) / tf.reduce_max(heatmap)
        heatmap = heatmap.numpy()
        
        # Redimensionar a tamaño original
        heatmap = cv2.resize(heatmap, (IMG_SIZE[1], IMG_SIZE[0]))
        
        # Convertir a imagen RGB
        heatmap = np.uint8(255 * heatmap)
        heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
        
        return heatmap
    except Exception as e:
        print(f"Error en Grad-CAM: {str(e)}", file=sys.stderr)
        return None

def predict(image_path, mask_path, model_type):
    """Realiza predicción con el modelo especificado"""
    try:
        # 1. Cargar modelo
        model_path = os.path.join("models", MODEL_MAP[model_type])
        if not os.path.exists(model_path):
            raise ValueError(f"Modelo no encontrado: {model_path}")
            
        model = load_model(model_path)
        
        # 2. Preprocesar imagen
        img = preprocess_image(image_path, mask_path)
        img_batch = np.expand_dims(img, axis=0)
        
        # 3. Preprocesar según el modelo
        if model_type == "mobilenet":
            img_batch = preprocess_input(img_batch)
        elif model_type == "efficientnet":
            img_batch = efficientnet_preprocess(img_batch)
        
        # 4. Realizar predicción
        pred = model.predict(img_batch, verbose=0)
        pred_value = float(pred[0][0])
        
        class_label = "sano" if pred_value < 0.5 else "patológico"
        confidence = 1 - pred_value if class_label == "sano" else pred_value
        
        # 5. Generar Grad-CAM
        grad_cam_img = generate_gradcam(model, img_batch)
        
        # 6. Convertir Grad-CAM a base64
        grad_cam_base64 = None
        if grad_cam_img is not None:
            _, buffer = cv2.imencode('.png', grad_cam_img)
            grad_cam_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return {
            "class": class_label,
            "confidence": round(confidence, 4),
            "raw_prediction": pred_value,
            "grad_cam": grad_cam_base64
        }
        
    except Exception as e:
        raise ValueError(f"Error en predicción: {str(e)}")

if __name__ == "__main__":
    try:
        if len(sys.argv) != 4:
            print(json.dumps({"error": "Uso: python predict.py <image_path> <mask_path> <model_type>"}), file=sys.stderr)
            sys.exit(1)
            
        image_path = sys.argv[1]
        mask_path = sys.argv[2]
        model_type = sys.argv[3]
        
        if model_type not in MODEL_MAP:
            print(json.dumps({"error": f"Modelo no válido. Opciones: {list(MODEL_MAP.keys())}"}), file=sys.stderr)
            sys.exit(1)
        
        result = predict(image_path, mask_path, model_type)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1) 