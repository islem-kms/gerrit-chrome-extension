// HELPER: Map current URL to the project keys your Python backend expects
const detectProjectKey = () => {
    const host = window.location.host;
    if (host.includes("opendev")) return "openstack";
    if (host.includes("android")) return "android";
    if (host.includes("qt-project")) return "qt";
    return null;
};

// LISTENER: Wait for the Popup to click "Predict"
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyze_repo") {
        
        // 1. Validate Project Support
        const projectKey = detectProjectKey();
        if (!projectKey) {
            sendResponse({ success: false, error: "This Gerrit instance is not supported by your ML models." });
            return true;
        }

        // 2. Extract Patch ID from URL
        // Matches /c/12345 or /c/project/+/12345
        const match = window.location.href.match(/\/c\/(?:.*\/)?\+?\/(\d+)/);
        const patchId = match ? match[1] : null;

        if (!patchId) {
            sendResponse({ success: false, error: "Could not find a valid Patch ID in this URL." });
            return true;
        }

        // 3. Ask Background Script to call Python API
        // (We pass user inputs 'days' and 'limit' from the popup)
        chrome.runtime.sendMessage({
            action: "fetch_prediction",
            data: {
                project: projectKey,
                patch_id: patchId,
                time_window: parseInt(request.days),
                top_k: parseInt(request.limit)
            }
        }, (backendResponse) => {
            
            // 4. Handle API Result
            if (backendResponse && backendResponse.success) {
                // If API returns an error message inside the JSON (e.g. 404)
                if (backendResponse.data.error) {
                    sendResponse({ success: false, error: backendResponse.data.error });
                } else {
                    // Success! Return the list of candidates
                    sendResponse({ success: true, data: backendResponse.data });
                }
            } else {
                sendResponse({ success: false, error: backendResponse.error || "Unknown Server Error" });
            }
        });

        return true; // Keep channel open
    }
});