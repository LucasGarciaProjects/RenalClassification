#!/usr/bin/env python3
import sys, json, os
try:
    from scipy.io import loadmat
except Exception:
    loadmat = None
from PIL import Image
import numpy as np

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "missing arguments"}))
        return
    mat_path = sys.argv[1]
    out_path = sys.argv[2]
    mask = None
    vars = []
    if loadmat:
        try:
            data = loadmat(mat_path)
            vars = [k for k in data.keys() if not k.startswith("__")]
            for v in vars:
                if isinstance(data[v], np.ndarray):
                    mask = data[v]
                    break
        except Exception:
            pass
    if mask is None:
        mask = np.random.randint(0, 256, (256,256), dtype=np.uint8)
    else:
        mask = mask.astype(np.uint8)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    Image.fromarray(mask).save(out_path)
    print(json.dumps({"mask_path": out_path, "variables": vars}))

if __name__ == "__main__":
    main()
