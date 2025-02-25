chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  // Allowed origins
  const allowedOrigins = [
    "https://zipit.gg",
    "http://localhost:3000/*",
    "https://staging.zipit.gg",
    "https://cms.zipit.gg",
    "https://staging.cms.zipit.gg",
  ];

  // Check if event.origin is in the allowed list
  if (!allowedOrigins.includes(message.origin)) return;

  // Ensure event.data has the expected structure
  if (typeof message.data !== "object" || message.data === null) return;

  // Send the message to the background script
  browser.runtime.sendMessage(message.data).catch((error) => {
    console.error("Error sending message to background script:", error);
  });
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "check") {
    sendResponse({ installed: true });
  }
});

// Event listener for messages from the content script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "extensionSuspended") {
    sendResponse({ suspended: true });
  }
});

// Event listener for messages from the content script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "extensionUninstalled") {
    sendResponse({ uninstalled: true });
  }
});

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log("Received request:", request);

//   // Safe check for sender.url
//   const senderUrl = sender.url || "unknown";
//   console.log("Message sent from:", senderUrl);

//   // Handle different actions
//   if (request.action === "check") {
//     sendResponse({ installed: true });
//   } else if (request.action === "extensionSuspended") {
//     sendResponse({ suspended: true });
//   } else if (request.action === "extensionUninstalled") {
//     sendResponse({ uninstalled: true });
//   }

//   // Forward message to the background script if data exists
//   if (request.data) {
//     try {
//       (chrome.runtime.sendMessage || browser.runtime.sendMessage)(request.data);
//     } catch (error) {
//       console.error("Error sending message to background script:", error);
//     }
//   }

//   return true; // Keep sendResponse available for async responses
// });

const runtime = chrome?.runtime ?? browser?.runtime;

runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "check") {
    console.log("Checking if extension is installed...");

    // Responding to content script
    sendResponse({ installed: true });

    return true; // Keep the message channel open for async response
  }
});
// window.addEventListener("message", (event) => {
//   if (event.data === "check_extension") {
//     window.postMessage({ isExtensionInstalled: true }, "*");
//   }
// });
