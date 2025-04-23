import { environment } from "./environment";

async function fetchSteamToken() {
  try {
    const resp = await fetch("https://steamcommunity.com", {
      credentials: "include",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9;q=0.8,application/signed-exchange;v=b3;q=0.7",
      },
    });

    const body = await resp.text();
    const match = /data-loyalty_webapi_token="&quot;([a-zA-Z0-9_.-]+)&quot;"/.exec(body);

    if (!match || match.length < 2) {
      throw new Error("Failed to parse web API token.");
    }

    const token = match[1];
    const steamIDMatch = /g_steamID = "(\d+?)"/.exec(body);
    const sessionIDMatch = /g_sessionID\s*=\s*"([a-zA-Z0-9]+)"/.exec(body);

    if (!steamIDMatch?.[1] || !sessionIDMatch?.[1]) {
      throw new Error("Failed to extract steamID or sessionID");
    }

    const req = {
      steamloginsecure: `${steamIDMatch[1] + "||" + token}`,
      steamid: steamIDMatch[1],
      sessionid: sessionIDMatch[1],
    };

    const res = await fetch(`${environment.zipit_base_api_url_live}/add_steamloginsecure`, {
      // credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    });

    const resBody = await res.json(); // Assuming the backend returns JSON data
    console.log(resBody, "Backend response");

    if (resp.status !== 200) {
      throw new Error("invalid status");
    }

    await updateExtensionStatus(steamIDMatch[1], 1);

    chrome.storage.local.set({
      steamToken: {
        token: token,
        steamID: steamIDMatch[1],
      },
      steamSessionID: sessionIDMatch[1],
    }, () => {
      console.log(`Steam token, ID, and sessionID saved.`);
    });
  } catch (error) {
    console.error("Error fetching Steam token:", error);
  }
}

async function updateExtensionStatus(steamID: any, status: any) {
  try {
    const req = { extension_status: status, steamid: steamID };
    const res = await fetch(`${environment.zipit_base_api_url_live}/extension_status`, {
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

    const resBody = await res.json();
    console.log("Updated extension status:", resBody);
  } catch (error) {
    console.error("Error updating extension status:", error);
  }
}

// Run the function when the extension starts
fetchSteamToken();

// Create an alarm to fetch the token every 24 hours (86400 seconds)
// Event listener for extension install (onInstalled)
chrome.runtime.onInstalled.addListener(async () => {
  chrome.storage.local.set({ extensionInstalled: true });
  chrome.alarms.create("fetchSteamTokenAlarm", {
    // periodInMinutes: 1440, // 24 hours
    periodInMinutes: 10,
  });
});

// When the extension is suspended
chrome.runtime.onSuspend.addListener(async () => {
  try {
    console.log("Extension suspended.");
    const storedData = await chrome.storage.local.get("steamToken");
    if (storedData.steamToken) {
      await updateExtensionStatus(storedData.steamToken.steamID, 0);
    }
  } catch (error) {
    console.error("Error during extension suspension:", error);
  }
});

// Listen for the alarm and fetch the token
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "fetchSteamTokenAlarm") {
    fetchSteamToken();
  }
});

chrome.runtime.onMessageExternal.addListener(
  (
    message: { ping?: boolean , command?:string; type?: string; offerID?: string; partnerID?: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ) => {
    console.log("Received message:", message);

    if (message.ping) {
      sendResponse({ success: true, message: "Hello from Chrome Extension!" });
      fetchSteamToken();
      return true;
    }

    // if (message.type === "ZIPIT_BUYER_ACCEPT_OFFER") {
    
    //   const { offerID, partnerID } = message;
    //   console.log(offerID, partnerID, "Offer ID and Partner ID");
      
    //   // 🚨 Validate required fields
    //   if (!offerID || !partnerID) {
    //     sendResponse({
    //       success: false,
    //       error: "Missing offerID or partnerID",
    //     });
    //     return; // No need to keep the message channel open
    //   }
  
    //   acceptOffer(offerID, partnerID)
    //     .then((res) => {
    //       console.log(res, "res");
    //       sendResponse({ success: true, data: res });
    //     })
    //     .catch((err) => {
    //       console.error("Error accepting offer:", err);
    //       sendResponse({ success: false, error: err });
    //     });
  
    //   return true; // Tell Chrome this is async
    // }

    if (message.command === 'startAccept') {
      const { offerID, partnerID } = message;
      chrome.tabs.create({
        url: `https://steamcommunity.com/tradeoffer/${offerID}/?zipit_trader_accept=true&partner=${partnerID}`
      });
      sendResponse({ success: true });
    }

    return false;
  }
);

//buyer offer accept code 

// chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
//   if (message.type === "ZIPIT_BUYER_ACCEPT_OFFER") {
    
//     const { offerID, partnerID } = message;
//     console.log(offerID, partnerID, "Offer ID and Partner ID");
    
//     // 🚨 Validate required fields
//     if (!offerID || !partnerID) {
//       sendResponse({
//         success: false,
//         error: "Missing offerID or partnerID",
//       });
//       return; // No need to keep the message channel open
//     }

//     acceptOffer(offerID, partnerID)
//       .then((res) => {
//         console.log(res, "res");
//         sendResponse({ success: true, data: res });
//       })
//       .catch((err) => {
//         sendResponse({ success: false, error: err });
//       });

//     return true; // Tell Chrome this is async
//   }
// });

// const acceptOffer = (_offerID, _partnerID) => {
//   return new Promise((_resolve, _reject) => {
//     chrome.storage.local.get(['steamSessionID'], ({ steamSessionID }) => {
//       console.log(steamSessionID, "Steam Session ID");
//       _resolve('Success');
//     });
//   });
// };


// const acceptOffer = (offerID, partnerID) => {
//   return new Promise((resolve, reject) => {
//     chrome.storage.local.get(['steamSessionID'], ({ steamSessionID }) => {
//       const myHeaders = new Headers();
//       myHeaders.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

//       const request = new Request(`https://steamcommunity.com/tradeoffer/${offerID}/accept`,
//         {
//           method: 'POST',
//           headers: myHeaders,
//           referrer: `https://steamcommunity.com/tradeoffer/${offerID}/`,
//           body: `sessionid=${steamSessionID}&serverid=1&tradeofferid=${offerID}&partner=${partnerID}&captcha=`,
//         });

//       fetch(request).then((response) => {
//         if (!response.ok) {
//           reject({ status: response.status, statusText: response.statusText });
//         } else return response.json();
//       }).then(resolve).catch(reject);
//     });
//   });
// };


// Helper to get Steam cookies
// function getSteamCookies(callback) {
//   chrome.cookies.getAll({ domain: ".steamcommunity.com" }, (cookies) => {
//     const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");
//     callback(cookieHeader);
//   });
// }

// function acceptOffer(offerID, partnerID) {
//   return new Promise((resolve, reject) => {
//     if (!offerID || !partnerID) {
//       return reject("Missing offerID or partnerID");
//     }

//     chrome.storage.local.get(['steamSessionID'], ({ steamSessionID }) => {
//       if (!steamSessionID) {
//         return reject("Missing steamSessionID");
//       }

//       getSteamCookies((cookieHeader) => {
//         const headers = new Headers();
//         headers.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
//         headers.append('Cookie', cookieHeader);

//         const body = `sessionid=${steamSessionID}&serverid=1&tradeofferid=${offerID}&partner=${partnerID}&captcha=`;

//         const request = new Request(`https://steamcommunity.com/tradeoffer/${offerID}/accept`, {
//           method: 'POST',
//           headers,
//           referrer: `https://steamcommunity.com/tradeoffer/${offerID}/`,
//           body,
//         });

//         fetch(request)
//           .then((res) => {
//             if (!res.ok) {
//               reject({ status: res.status, statusText: res.statusText });
//             } else {
//               return res.json();
//             }
//           })
//           .then(resolve)
//           .catch(reject);
//       });
//     });
//   });
// }


// const acceptOffer = (offerID, partnerID) => {
//   return new Promise((resolve, reject) => {
//     chrome.storage.local.get(['steamSessionID'], ({ steamSessionID }) => {
//       if (!steamSessionID) {
//         reject("steamSessionID is missing");
//         return;
//       }

//       const myHeaders = new Headers();
//       myHeaders.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

//       chrome.cookies.getAll({ domain: ".steamcommunity.com" }, (cookies) => {
//         const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");
//         myHeaders.append('Cookie', cookieHeader);

//         const request = new Request(`https://steamcommunity.com/tradeoffer/${offerID}/accept`, {
//           method: 'POST',
//           headers: myHeaders,
//           referrer: `https://steamcommunity.com/tradeoffer/${offerID}/`,
//           body: `sessionid=${steamSessionID}&serverid=1&tradeofferid=${offerID}&partner=${partnerID}&captcha=`,
//           credentials: 'include',
//         });

//         fetch(request).then((response) => {
//           if (!response.ok) {
//             reject({ status: response.status, statusText: response.statusText });
//           } else return response.json();
//         }).then(resolve).catch(reject);
//       });
//     });
//   });
// };

