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

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('zipit_trader_accept') === 'true') {
  const offerID = window.location.pathname.split('/')[2];
  const partnerID = urlParams.get('partner');

  const acceptInterval = setInterval(() => {
    acceptOffer(offerID, partnerID).then(() => {
      clearInterval(acceptInterval);
      window.close();
    });
  }, 2000);
}

function acceptOffer(offerID, partnerID) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['steamSessionID'], ({ steamSessionID }) => {
      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

      const request = new Request(`https://steamcommunity.com/tradeoffer/${offerID}/accept`, {
        method: 'POST',
        headers: myHeaders,
        referrer: `https://steamcommunity.com/tradeoffer/${offerID}/`,
        body: `sessionid=${steamSessionID}&serverid=1&tradeofferid=${offerID}&partner=${partnerID}&captcha=`
      });

      fetch(request)
        .then(response => {
          if (!response.ok) {
            console.log(`Error code: ${response.status}`);
            reject({ status: response.status });
          } else {
            return response.json();
          }
        })
        .then(resolve)
        .catch(reject);
    });
  });
}
