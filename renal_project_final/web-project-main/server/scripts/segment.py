#!/usr/bin/env python3
import sys, os, json
from PIL import Image
import numpy as np

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "missing arguments"}))
        return
    image_path = sys.argv[1]
    output_path = sys.argv[2]
    img = Image.open(image_path)
    mask = np.zeros(img.size[::-1], dtype=np.uint8)
    h, w = mask.shape
    mask[h//4:3*h//4, w//4:3*w//4] = 255
    Image.fromarray(mask).save(output_path)
    print(json.dumps({"mask_path": output_path, "confidence": 0.9}))

if __name__ == "__main__":
    main()
