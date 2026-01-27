from flask import Flask, request, jsonify
from flask_cors import CORS
from core.engine import SmartPatchEngine
from core.gerrit import GerritClient

app = Flask(__name__)
CORS(app)

# --- STARTUP ---
engine = SmartPatchEngine()

# Configure your paths here!
DATA_DIR = "data"
engine.load_project("openstack", f"{DATA_DIR}/openstack/all_candidates.csv", f"{DATA_DIR}/openstack/model_openstack.pkl")
# engine.load_project("qt", f"{DATA_DIR}/qt/all_candidates.csv", f"{DATA_DIR}/qt/model_qt_global.pkl")
# engine.load_project("android", f"{DATA_DIR}/android/all_candidates.csv", f"{DATA_DIR}/android/model_android.pkl")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "active", "loaded_projects": engine.loaded_projects})

@app.route('/predict_topk', methods=['POST'])
def predict_topk():
    data = request.json
    project = data.get("project", "").lower()
    patch_id = str(data.get("patch_id", "")).strip()
    window = int(data.get("time_window", 14))
    top_k = int(data.get("top_k", 5))

    if project not in engine.loaded_projects:
        return jsonify({"error": f"Project '{project}' not loaded or supported."}), 400

    # 1. Get Reference Patch Details (from CSV or API)
    # Check if inside dataset first (faster)
    df = engine.datasets[project]
    existing_row = df[df.patch_id == patch_id]
    
    if not existing_row.empty:
        # Use cached data
        row = existing_row.iloc[0]
        patch_ref = {
            "patch_id": row.patch_id,
            "title": row.title,
            "description": row.description,
            "created_time": row.created_time,
            "files": engine._safe_parse_list(row.files)
        }
    else:
        # Fetch from API
        patch_ref = GerritClient.get_patch_details(project, patch_id)
        if not patch_ref:
            return jsonify({"error": "Patch not found in dataset or Gerrit API"}), 404

    # 2. Run Prediction
    try:
        results = engine.predict(project, patch_ref, top_k=top_k, window_days=window)
        return jsonify(results)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 SmartPatch Server running on http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)