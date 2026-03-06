# RenalClassification

### AI-Based Kidney Ultrasound Disease Detection

This project implements a **deep learning system for binary classification of kidney ultrasound images**, capable of distinguishing between **healthy kidneys and kidneys with disease**.

The system combines **state-of-the-art convolutional neural networks with a full-stack web application**, allowing users to upload ultrasound images and obtain real-time predictions with downloadable diagnostic reports.

The project was developed as part of the **Data Science and Engineering program at Universidad Carlos III de Madrid**. 

---

# Project Overview

Kidney disease affects **hundreds of millions of people worldwide**, and early diagnosis is crucial to prevent progression toward kidney failure and other complications. Ultrasound imaging is one of the most common and non-invasive diagnostic techniques, but interpretation often requires expert radiologists and may vary between observers. 

This project explores how **deep learning models can assist medical professionals** by automatically classifying renal ultrasound images.

The developed system:

* trains multiple CNN architectures using **transfer learning**
* handles **imbalanced medical datasets**
* integrates **segmentation masks to focus on kidney regions**
* deploys the models in a **web application for real-time inference**

The final application demonstrates how machine learning research can be transformed into **practical clinical support tools**.

---

# Dataset

The dataset contains **1,985 renal ultrasound images** with corresponding segmentation masks. 

Class distribution:

* Diseased kidneys: **1,535 images**
* Healthy kidneys: **450 images**

This class imbalance introduces challenges during training, requiring careful model evaluation and threshold optimization.

---

# Model Development

Three state-of-the-art convolutional neural network architectures were evaluated:

* **MobileNetV2**
* **ResNet50**
* **EfficientNetB0**

All models were trained using **transfer learning with ImageNet weights**.

## Training Strategy

The training pipeline included:

* frozen base layers for initial training
* progressive layer unfreezing
* data augmentation
* early stopping and checkpointing
* threshold optimization based on F1-score and balanced accuracy

Images were preprocessed using:

* segmentation mask overlay (ROI extraction)
* resizing to 224×224
* RGB conversion
* normalization
* stratified dataset splitting

These steps ensured robust training despite the relatively small dataset.

---

# Model Performance

Evaluation was conducted using metrics suitable for **imbalanced medical datasets**, including:

* Precision
* Recall
* F1-score
* Balanced accuracy
* ROC-AUC

Summary of results:

| Model          | Accuracy | ROC-AUC | Notes                                         |
| -------------- | -------- | ------- | --------------------------------------------- |
| MobileNetV2    | ~0.65    | ~0.71   | Lightweight but weaker generalization         |
| ResNet50       | ~0.76    | ~0.84   | Strong performance detecting diseased cases   |
| EfficientNetB0 | ~0.76    | ~0.80   | Most balanced performance across both classes |

Key findings:

* **EfficientNetB0** achieved the most balanced results across healthy and diseased cases.
* **ResNet50** showed the strongest performance in detecting diseased kidneys.
* **MobileNetV2** provided a lightweight alternative but with lower overall performance.

---

# Web Application

Alongside the deep learning models, a **web-based interface** was developed to demonstrate real-world usage.

## Application Features

Users can:

* upload an ultrasound image and its segmentation mask
* select which trained model to use
* obtain classification predictions in real time
* view prediction probabilities
* download a **PDF diagnostic report**

This interface allows non-technical users to interact with the models easily and simulates a clinical workflow.

---

# Technology Stack

Frontend

* Next.js
* React
* TypeScript
* TailwindCSS

Backend

* Python
* TensorFlow / Keras
* NumPy
* OpenCV

Machine Learning

* Transfer learning with pretrained CNN architectures
* Image preprocessing and augmentation
* ROC-based threshold optimization

---

# Running the Project

## 1 Clone the repository

```
git clone https://github.com/LucasGarciaProjects/RenalClassification.git
cd RenalClassification
```

## 2 Install dependencies

Create a Python environment and install the required libraries.

```
pip install -r requirements.txt
```

## 3 Run the backend

```
python app.py
```

## 4 Start the frontend

```
npm install
npm run dev
```

The application will be available locally in your browser.

---

# Limitations

Despite encouraging results, several limitations remain:

* relatively small dataset
* class imbalance between healthy and diseased cases
* variability in ultrasound image quality
* lack of patient metadata

These factors limit generalization and highlight the need for **larger clinical datasets**.

---

# Future Improvements

Possible future developments include:

* dataset expansion with additional healthy cases
* model explainability techniques (Grad-CAM, SHAP, LIME)
* ensemble models combining multiple CNN architectures
* deployment on edge devices or ultrasound systems
* integration with clinical validation pipelines

---

# Academic Context

This project was developed as a **Data Science project within the BSc in Data Science and Engineering** at:

**Universidad Carlos III de Madrid**

Author:
Lucas García García

---

# Portfolio

More projects and technical work can be found at:

**https://lucasgarcia.eu**
