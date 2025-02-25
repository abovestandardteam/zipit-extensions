declare global {
  interface Window {
    myFirefoxExtensionInstalled?: boolean;
  }
}

// Ensure it's running in the browser before assigning
if (typeof window !== "undefined") {
  window.myFirefoxExtensionInstalled = true;
}

export {};

// chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
//   // Allowed origins
//   const allowedOrigins = [
//     "https://zipit.gg",
//     "http://localhost:3000/*",
//     "https://staging.zipit.gg",
//     "https://cms.zipit.gg",
//     "https://staging.cms.zipit.gg",
//   ];

//   // Check if event.origin is in the allowed list
//   if (!allowedOrigins.includes(message.origin)) return;

//   // Ensure event.data has the expected structure
//   if (typeof message.data !== "object" || message.data === null) return;

//   // Send the message to the background script
//   browser.runtime.sendMessage(message.data).catch((error) => {
//     console.error("Error sending message to background script:", error);
//   });
// });

// browser.runtime
//   .sendMessage({ action: "test" })
//   .then((response) => console.log("Received:", response))
//   .catch((error) => console.error("Error:", error));
