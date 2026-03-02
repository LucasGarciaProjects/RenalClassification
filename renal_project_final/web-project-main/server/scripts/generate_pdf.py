#!/usr/bin/env python3
import json
import base64
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
from reportlab.platypus.flowables import HRFlowable
from datetime import datetime
import sys
import os

def get_model_display_name(model_key):
    """Get display name for model types"""
    model_names = {
        'mobilenet': 'MobileNetV2 (Fine-tuned)',
        'efficientnet': 'EfficientNetB0 (Fine-tuned)',
        'resnet': 'ResNet (Fine-tuned)'
    }
    return model_names.get(model_key, model_key)

# Expected inputs
if len(sys.argv) < 2:
    print(json.dumps({"error": "Usage: python generate_pdf.py json_path"}))
    sys.exit(1)

json_path = sys.argv[1]
output_path = sys.argv[2] if len(sys.argv) > 2 else "output.pdf"

try:
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
except Exception as e:
    print(json.dumps({"error": f"Error reading JSON: {str(e)}"}))
    sys.exit(1)

def decode_base64_image(base64_string):
    """Decode base64 image to ImageReader"""
    try:
        return ImageReader(BytesIO(base64.b64decode(base64_string)))
    except Exception as e:
        raise ValueError(f"Error decoding image: {str(e)}")

# Create PDF
try:
    # Create PDF document
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    story = []
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.darkblue
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=15,
        alignment=TA_LEFT,
        textColor=colors.darkgreen
    )
    
    # Header
    story.append(Paragraph("Kidney Ultrasound Analysis Report", title_style))
    story.append(Paragraph(f"Date: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Analysis Summary
    story.append(Paragraph("Analysis Summary", subtitle_style))
    
    # Access correct data structure
    classification = data.get("class", "unknown")
    confidence = data.get("confidence", 0) * 100
    
    # Create summary table
    summary_data = [
        ["Field", "Value"],
        ["Analysis Date", datetime.now().strftime("%d/%m/%Y %H:%M:%S")],
        ["Model Used", get_model_display_name(data.get('model', 'N/A'))],
        ["Classification", classification.title()],
        ["Confidence", f"{confidence:.1f}%"],
        ["Raw Prediction", f"{data.get('raw_prediction', 0):.4f}"],
    ]
    
    # Add file information if available
    if 'imageFile' in data:
        summary_data.append(["Image File", f"{data['imageFile'].get('name', 'N/A')} ({data['imageFile'].get('size', 0)} bytes)"])
    if 'maskFile' in data:
        summary_data.append(["Mask File", f"{data['maskFile'].get('name', 'N/A')} ({data['maskFile'].get('size', 0)} bytes)"])
    
    summary_table = Table(summary_data, colWidths=[2*inch, 3*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    story.append(summary_table)
    story.append(Spacer(1, 20))
    
    # Images
    story.append(Paragraph("Analysis Images", subtitle_style))
    
    # Add images if available
    if data.get('original_image'):
        try:
            # Original image
            original_img_data = base64.b64decode(data['original_image'])
            original_img_stream = BytesIO(original_img_data)
            
            story.append(Paragraph("Original Image:", styles['Normal']))
            original_img = Image(original_img_stream, width=3*inch, height=2.25*inch)
            original_img.hAlign = 'CENTER'
            story.append(original_img)
            story.append(Spacer(1, 10))
            
        except Exception as e:
            story.append(Paragraph(f"Error loading original image: {str(e)}", styles['Normal']))
    
    if data.get('masked_image'):
        try:
            # Masked image
            masked_img_data = base64.b64decode(data['masked_image'])
            masked_img_stream = BytesIO(masked_img_data)
            
            story.append(Paragraph("Image with Applied Mask:", styles['Normal']))
            masked_img = Image(masked_img_stream, width=3*inch, height=2.25*inch)
            masked_img.hAlign = 'CENTER'
            story.append(masked_img)
            story.append(Spacer(1, 10))
            
        except Exception as e:
            story.append(Paragraph(f"Error loading masked image: {str(e)}", styles['Normal']))
    
    story.append(Spacer(1, 20))
    
    # Interpretation
    story.append(Paragraph("Interpretation", subtitle_style))
    
    interpretation_text = f"""
    The deep learning model analyzed the ultrasound image and classified it as {classification} with {confidence:.1f}% confidence.
    
    The analysis focused on the masked region of interest to provide accurate classification results. 
    The model processed the image using advanced convolutional neural networks to identify patterns 
    associated with kidney conditions.
    
    This report was automatically generated using state-of-the-art machine learning techniques 
    for medical image analysis.
    """
    
    story.append(Paragraph(interpretation_text, styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Footer
    story.append(Paragraph(
        f"Report generated on {datetime.now().strftime('%d/%m/%Y at %H:%M:%S')}",
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, alignment=TA_CENTER)
    ))
    
    # Build PDF
    doc.build(story)
    
    print(json.dumps({"success": True, "output_path": os.path.abspath(output_path)}))
    
except Exception as e:
    print(json.dumps({"error": f"Error creating PDF: {str(e)}"}))
    sys.exit(1)
