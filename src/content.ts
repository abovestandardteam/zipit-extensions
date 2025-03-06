window.addEventListener("message", (event:any) => {
  if (event.data.type === "CHECK_IF_ZIPIT_MARKET_EXTENSION") {
    // Ensure the request is coming from an allowed origin
    // const allowedOrigins = [
    //   "https://zipit.gg",
    //   "http://localhost:3000/inventory",
    //   "https://staging.zipit.gg",
    //   "https://cms.zipit.gg",
    //   "https://staging.cms.zipit.gg",
    // ];

    // if (!allowedOrigins.includes(event.origin)) {
    //   console.warn("Blocked message from unauthorized origin:", event.origin);
    //   return;
    // }

    // Respond to the webpage
    event.source.postMessage({ extensionDetected: true }, event.origin);
  }
});

