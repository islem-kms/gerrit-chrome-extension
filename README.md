# SmartPatchLinker

**SmartPatchLinker** is a browser-based research tool designed to accelerate Modern Code Review. It detects semantically related changes (e.g., "Alternative Solutions") in Gerrit by analyzing patch descriptions and file paths using a local **Sentence-BERT (SBERT)** model.

Unlike Gerrit's native "Related Changes" feature, which only tracks Git dependencies, SmartPatchLinker identifies "soft" semantic links, helping developers avoid redundant work and discover orphan changes in real-time.

<!-- ![Extension Preview](https://via.placeholder.com/800x400?text=Insert+Screenshot+of+SmartPatch+Linker+Here) -->

## 🚀 Features

* **Real-time Inference:** Analyze the current patch against thousands of historical changes.
* **Semantic Search:** Uses `all-MiniLM-L6-v2` (SBERT) to find matches even if they use different vocabulary.
* **Privacy-First:** The ML model runs **locally** on your machine via Docker. No code is sent to third-party cloud APIs.
<!-- * **Platform Support:** Optimized for **OpenStack**, **Android**, and **Qt** Gerrit instances. -->
* **Platform Support:** Optimized for **OpenStack** Gerrit instances.
* **Interactive UI:** "Glassmorphism" popup to configure lookback windows (e.g., 7, 14, 30 days).

# 🛠️ Installation Guide

This guide covers how to set up the **SmartPatchLinker** environment. The system consists of two parts:
1.  **Backend:** A local Python server (Flask/Docker) that handles the ML inference.
2.  **Frontend:** A Chrome Extension that interacts with the Gerrit web interface.

---

## Part 1: Backend Setup (The "Brain")

The backend requires pre-trained models and datasets to function.

### Run the Server
You can run the server using **Docker** (Recommended) or **Python** directly.
#### Option A: Using Docker 🐳 (Recommended)
This method ensures all dependencies (scikit-learn, pytorch, etc.) are isolated and correct.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Build the Docker image:**
    ```bash
    docker build -t backend .
    ```

3.  **Run the container:**
    ```bash
    docker run -p 5000:5000 backend
    ```

*Success Check: The terminal should show `Running on http://0.0.0.0:5000`.*

#### Option B: Using Python Manually 🐍
If you prefer to run it natively on your machine:

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Start the Flask server:**
    ```bash
    python app.py
    ```

*Success Check: The terminal should show `Running on http://0.0.0.0:5000`.*

### ✅ Verification

To verify the installation was successful:

1.  **Ensure the backend is running.**
2.  **Open your browser and visit:** `http://127.0.0.1:5000/health`
3.  **You should see a JSON response:**
    ```json
    {
      "status": "active",
      "loaded_projects": ["openstack", "android", "qt"]
    }
    ```
<!-- 4.  **Go to a supported Gerrit page** (e.g., [review.opendev.org](https://review.opendev.org/)) and click the extension icon to start predicting. -->

---

## Part 2: Frontend Setup (The "Interface")

1.  **Open Google Chrome.**
2.  **Navigate to** `chrome://extensions`.
3.  **Enable Developer mode** by toggling the switch in the top-right corner.
4.  **Click the "Load unpacked" button** (top-left).
5.  **Select the `frontend` folder** from this repository.
6.  **The SmartPatchLinker icon** should now appear in your browser toolbar.

---
## 📖 Usage

1.  **Ensure the Backend is Running:** Verify that your Docker container or Python script is active.
2.  **Navigate to Gerrit:** Go to a supported Gerrit change page (e.g., [review.opendev.org](https://review.opendev.org/)).
3.  **Open the Tool:** Click the extension icon in the toolbar.
4.  **Configure:**
    * **Time Window:** Set how many days back the model should search (Default: 14 days).
    * **Top-K:** Set the number of results to display (Default: 5).
5.  **Predict:** Click **"Run Prediction"**.
    * The tool will display a list of semantically related patches with a confidence score (e.g., "Match: 92%").
    <!-- * Clicking a result will take you to that patch. -->

---
## 📄 Citation
If you use this tool in your research, please cite our paper:
```
@inproceedings{smartpatch2026,
  title={SmartPatchLinker: A Browser-Based Assistant for Retrieving Semantic Patch Linkages},
  author={Khemissi, Islem and Chouchen, Moataz},
  booktitle={Proceedings of the ACM International Conference on the Foundations of Software Engineering (FSE '26)},
  year={2026},
  address={Montréal, Canada},
  note={To appear}
}
```