// Listen for messages from content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetch_prediction") {
    
    // Call the local Python API
    fetch("http://127.0.0.1:5000/predict_topk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request.data)
    })
    .then(response => response.json())
    .then(data => {
      // Forward the API response back to the content script
      sendResponse({ success: true, data: data });
    })
    .catch(error => {
      console.error("Connection Error:", error);
      sendResponse({ 
        success: false, 
        error: "Cannot reach Local Server. Is 'app.py' running?" 
      });
    });

    return true; // Keep the message channel open for the async response
  }
});