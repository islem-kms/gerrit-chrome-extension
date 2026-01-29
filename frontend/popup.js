document.addEventListener('DOMContentLoaded', async () => {
    // 1. Get the current tab to generate a unique key (URL)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) return;

    const uniqueKey = tab.url;

    // 2. CHECK STORAGE: Restore state if it exists
    chrome.storage.local.get([uniqueKey], (result) => {
        const cachedData = result[uniqueKey];
        
        if (cachedData) {
            // Restore Inputs
            document.getElementById('daysInput').value = cachedData.days || 14;
            document.getElementById('limitInput').value = cachedData.limit || 5;
            
            // Restore Status Message (Now includes the old timer!)
            const statusEl = document.getElementById('statusMessage');
            statusEl.textContent = cachedData.statusText || "Restored from cache.";
            statusEl.style.color = "#57606a";

            // Restore Results
            if (cachedData.results) {
                renderResults(cachedData.results, tab.url);
            }
        }
    });

    // 3. ATTACH CLICK LISTENER
    document.getElementById('predictBtn').addEventListener('click', () => {
        runPrediction(tab);
    });
});

async function runPrediction(tab) {
    const days = document.getElementById('daysInput').value;
    const limit = document.getElementById('limitInput').value;
    const statusEl = document.getElementById('statusMessage');
    const resultsEl = document.getElementById('resultsList');

    // UI Reset
    statusEl.textContent = "Processing...";
    statusEl.style.color = "#57606a";
    resultsEl.innerHTML = "";

    // --- ⏱️ START TIMER ---
    const startTime = performance.now(); 

    try {
        // Send inputs to Content Script
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: "analyze_repo",
            days: days,
            limit: limit
        });

        // --- ⏱️ END TIMER ---
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime); // Calculate milliseconds

        if (response && response.success) {
            const resultCount = response.data.length;
            
            // Update status text with time
            const successMsg = `Found ${resultCount} patches in ${duration}ms`;
            
            statusEl.textContent = successMsg;

            // --- SAVE STATE TO STORAGE ---
            const stateToSave = {
                results: response.data,
                days: days,
                limit: limit,
                statusText: successMsg, // Saves the time string too
                timestamp: Date.now()
            };
            
            let storageObj = {};
            storageObj[tab.url] = stateToSave;
            chrome.storage.local.set(storageObj);
            // -----------------------------

            renderResults(response.data, tab.url);

        } else {
            statusEl.textContent = response.error || "Analysis Failed.";
            statusEl.style.color = "#cf222e";
        }
    } catch (error) {
        statusEl.textContent = "Connection Error or Refresh Required.";
        console.error(error);
    }
}

function renderResults(predictions, currentTabUrl) {
    const container = document.getElementById('resultsList');
    container.innerHTML = ""; 

    if (!predictions || predictions.length === 0) {
        container.innerHTML = "<div class='no-results'>No high-confidence matches found.</div>";
        return;
    }

    const urlObj = new URL(currentTabUrl);
    const origin = urlObj.origin;

    predictions.forEach(item => {
        const percentage = (item.score * 100).toFixed(1) + "%";
        
        const div = document.createElement('div');
        div.className = 'result-item';
        div.style.cursor = "pointer"; 
        
        div.innerHTML = `
            <div class="result-header">
                <span class="result-date">${item.created_time}</span>
                <span class="result-status status-ml-match">Match: ${percentage}</span>
            </div>
            <div class="result-subject">${item.title}</div>
            <div class="result-id">ID: ${item.patch_id}</div>
        `;
        
        div.addEventListener('click', () => {
            const targetUrl = `${origin}/q/${item.patch_id}`;
            chrome.tabs.create({ url: targetUrl });
        });

        container.appendChild(div);
    });
}