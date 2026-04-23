import os
import json
import traceback
from flask import Flask, request, jsonify

app = Flask(__name__)

# Ollama API endpoint (default port)
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
MODEL_NAME = os.environ.get("QWEN_MODEL_NAME", "qwen2.5vl:3b")

print(f"[STARTUP] Qwen Vision Server (Ollama backend)")
print(f"[STARTUP] Ollama URL: {OLLAMA_URL}")
print(f"[STARTUP] Model: {MODEL_NAME}")


@app.route("/analyze", methods=["POST"])
def analyze_image():
    data = request.json
    base64_image = data.get("imageBase64")

    if not base64_image:
        return jsonify({"error": "No imageBase64 provided"}), 400

    prompt = """Analyze this image of a medicine package or label.
Identify the medication and extract the following details.
Return the result strictly as a valid JSON object without any backticks or markdown formatting.
Required JSON structure:
{
  "name": "The drug or brand name (e.g., Paracetamol, Metformin, Dolo 650)",
  "dosage": "The dosage strength (e.g., 500mg, 10ml, 650mg)",
  "form": "The physical form (e.g., tablet, capsule, syrup, unknown)",
  "confidence": 0.95
}
If you cannot identify a medicine, return:
{"name": "Unknown", "dosage": "unknown", "form": "unknown", "confidence": 0.1}"""

    try:
        # Format the base64 image for Ollama
        if not base64_image.startswith('data:image'):
            image_data = base64_image
        else:
            image_data = base64_image.split(",")[-1]

        # Call Ollama API with vision model
        import urllib.request

        payload = json.dumps({
            "model": MODEL_NAME,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                    "images": [image_data]
                }
            ],
            "stream": False,
            "options": {
                "temperature": 0.1,
                "num_predict": 256
            }
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{OLLAMA_URL}/api/chat",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        print(f"[ANALYZE] Sending image to Ollama ({MODEL_NAME})...")

        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read().decode("utf-8"))

        output_text = result.get("message", {}).get("content", "")
        print(f"[ANALYZE] Raw Ollama output:\n{output_text}")

        # Clean up output in case the LLM returned Markdown
        cleaned = output_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        # Try to extract JSON from the response
        try:
            result_json = json.loads(cleaned)
            response = {
                "name": result_json.get("name", "Unknown"),
                "dosage": result_json.get("dosage", "unknown"),
                "form": result_json.get("form", "unknown"),
                "confidence": result_json.get("confidence", 0.75)
            }
            print(f"[ANALYZE] Detected: {response['name']} {response['dosage']} ({response['form']})")
            return jsonify(response)
        except json.JSONDecodeError:
            # Try to find JSON within the text
            import re
            json_match = re.search(r'\{[^}]+\}', cleaned)
            if json_match:
                try:
                    result_json = json.loads(json_match.group())
                    response = {
                        "name": result_json.get("name", "Unknown"),
                        "dosage": result_json.get("dosage", "unknown"),
                        "form": result_json.get("form", "unknown"),
                        "confidence": result_json.get("confidence", 0.75)
                    }
                    print(f"[ANALYZE] Detected (regex): {response['name']} {response['dosage']}")
                    return jsonify(response)
                except:
                    pass
            
            print("[ANALYZE] Failed to parse JSON from model output. Returning raw text.")
            return jsonify({
                "name": "Unknown",
                "dosage": "unknown",
                "form": "unknown",
                "confidence": 0.3,
                "raw": output_text
            })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    try:
        import urllib.request
        req = urllib.request.Request(f"{OLLAMA_URL}/api/tags")
        with urllib.request.urlopen(req, timeout=5) as resp:
            models = json.loads(resp.read().decode("utf-8"))
        model_names = [m["name"] for m in models.get("models", [])]
        has_model = MODEL_NAME in model_names or any(MODEL_NAME.split(":")[0] in n for n in model_names)
        return jsonify({
            "status": "ok",
            "ollama": "connected",
            "model": MODEL_NAME,
            "model_available": has_model,
            "available_models": model_names
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    print("[STARTUP] Starting Qwen Vision API on http://127.0.0.1:5000")
    print("[STARTUP] Make sure Ollama is running and the model is pulled.")
    app.run(host="127.0.0.1", port=5000)
