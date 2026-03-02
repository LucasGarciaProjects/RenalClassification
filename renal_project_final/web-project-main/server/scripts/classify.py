#!/usr/bin/env python3
import sys, json, random

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "missing arguments"}))
        return
    prediction = random.choice(["normal", "pathological"])
    confidence = round(random.uniform(0.7, 0.99), 3)
    print(json.dumps({"classification": prediction, "confidence": confidence}))

if __name__ == "__main__":
    main()
