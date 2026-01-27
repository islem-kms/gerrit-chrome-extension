document.getElementById('predictBtn').addEventListener('click', async () => {
    const days = document.getElementById('daysInput').value;
    const limit = document.getElementById('limitInput').value;
    const statusEl = document.getElementById('statusMessage');
    const resultsEl = document.getElementById('resultsList');

    // UI Reset
    statusEl.textContent = "Processing with ML Model...";
    statusEl.style.color = "#57606a";
    resultsEl.innerHTML = "";

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
        statusEl.textContent = "Error: No active tab.";
        return;
    }

    try {
        // Send inputs to Content Script
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: "analyze_repo",
            days: days,
            limit: limit
        });

        if (response && response.success) {
            statusEl.textContent = `Found ${response.data.length} related patches.`;
            renderResults(response.data);
        } else {
            statusEl.textContent = response.error || "Analysis Failed.";
            statusEl.style.color = "#cf222e"; // Red error color
        }
    } catch (error) {
        statusEl.textContent = "Connection Error. Refresh the page and try again.";
        console.error(error);
    }
});

function renderResults(predictions) {
    const container = document.getElementById('resultsList');
    
    if (predictions.length === 0) {
        container.innerHTML = "<div class='no-results'>No high-confidence matches found.</div>";
        return;
    }

    predictions.forEach(item => {
        // Create a Score Badge (e.g., 95.2%)
        const percentage = (item.score * 100).toFixed(1) + "%";
        
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `
            <div class="result-header">
                <span class="result-date">${item.created_time}</span>
                <span class="result-status status-ml-match">Match: ${percentage}</span>
            </div>
            <div class="result-subject">${item.title}</div>
            <div class="result-id">ID: ${item.patch_id}</div>
        `;
        
        // Optional: Add click listener to open that patch
        div.addEventListener('click', () => {
            // Construct URL based on project (simplified)
            // Ideally, the backend would return the full URL, but we can guess:
            const currentBase = window.location.origin; 
            // This won't work perfectly if you cross-project link, 
            // but for same-project links it's fine:
            // chrome.tabs.create({ url: ... });
        });

        container.appendChild(div);
    });
}