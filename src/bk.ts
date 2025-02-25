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
    if (!steamIDMatch || steamIDMatch.length === 0) {
      return null;
    }

    const req = {
      steamloginsecure: `${steamIDMatch[1] + "||" + token}`,
      steamid: steamIDMatch[1],
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
    // const req1 = {
    //   extension_status: 1,
    //   steamid: steamIDMatch[1], // Use the retrieved Steam ID
    // };

    // const res1 = await fetch(`${environment.zipit_base_api_url}/extension_status`, {
    //   credentials: "include",
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(req1),
    // });

    // const resBody2 = await res1.json();
    // console.log(resBody2, "Backend response");

    // Store the token in Chrome storage
    // chrome.storage.local.set({ steamToken: token }, () => {
    //   console.log("Steam API token saved.");
    // });

    chrome.storage.local.set({ [`steamToken`]: { token: token, steamID: steamIDMatch[1] } }, () => {
      console.log(`Steam API token and ID for ${steamIDMatch[1]} saved.`);
    });
  } catch (error) {
    console.error("Error fetching Steam token:", error);
  }
}

async function updateExtensionStatus(steamID: any, status: any) {
  try {
    const req = { extension_status: status, steamid: steamID };
    const res = await fetch(`${environment.zipit_base_api_url}/extension_status`, {
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
    periodInMinutes: 30, //  30 hours
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

// When the extension is uninstalled
// chrome.management.onUninstalled.addListener(async () => {
//   try {
//     alert("Extension uninstalled");
//     // Get the stored Steam Token and Steam ID
//     chrome.storage.local.get(["steamToken"], async (result) => {
//       let data = result["steamToken"];
//       data = data ? JSON.parse(data) : null;

//       if (data) {
//         console.log("Token:", data.token);
//         console.log("Steam ID:", data.steamID);
//         const id = data.steamID; // Assign the Steam ID here

//         // Send the request to update extension status using the Steam ID
//         const req = {
//           extension_status: 0, // Assuming 0 indicates uninstalled state
//           steamid: id, // Use the retrieved Steam ID
//         };

//         try {
//           const res = await fetch(`${environment.zipit_base_api_url_live}/extension_status`, {
//             credentials: "include",
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify(req),
//           });

//           const resBody = await res.json();
//           console.log(resBody, "Backend response for uninstallation");
//         } catch (error) {
//           console.error("Error during API request:", error);
//         }
//       } else {
//         console.log("Token and Steam ID not found for the specified ID.");
//       }
//     });

//     // Handle any additional cleanup if needed
//   } catch (error) {
//     console.error("Error during extension uninstallation:", error);
//   }
// });

// Listen for the alarm and fetch the token
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "fetchSteamTokenAlarm") {
    fetchSteamToken();
  }
});

// const runtime = chrome?.runtime ?? browser?.runtime;

// // Handle messages from content scripts or popup
// runtime.onMessage.addListener((request, _sender, sendResponse) => {
//   console.log("Received message:", request);
//   console.log("Received message in extension:", request);
//   if (request.action === "check_extension_installed") {
//     sendResponse({ installed: true });
//   }
//   if (request.action === "zipit_check_extension_installed") {
//     sendResponse({ extensionInstalled: true });
//   }
//   if (request.action === "check") {
//     sendResponse({ installed: true });
//   } else if (request.action === "extensionSuspended") {
//     sendResponse({ suspended: true });
//   } else if (request.action === "extensionUninstalled") {
//     sendResponse({ uninstalled: true });
//   }

//   return true; // Keep the response channel open for async operations
// });

chrome.runtime.onMessageExternal.addListener(
  (
    message: { ping?: boolean },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: { success: boolean; message: string }) => void
  ) => {
    console.log("📩 Received External Message:", message, "From:", sender);

    if (message.ping) {
      sendResponse({ success: true, message: "Hello from Chrome Extension!" });

      // Send Steam Token back to the website
      chrome.storage.local.get("steamToken", (data: { steamToken?: string }) => {
        console.log(data.steamToken, "Steam Token");

        if (data.steamToken && sender.tab?.id) {
          chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            func: (token: string) => {
              window.postMessage({ steamToken: token }, "*");
            },
            args: [data.steamToken],
          });
        }
      });
    }

    return true;
  }
);

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "open_popup") {
    console.log("Message received from website.");
    sendResponse({ status: "success", message: "Extension connected!" });
  }
});

// chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
//   if (request.action === "test_ping") {
//     console.log("Ping received");
//     sendResponse({ message: "pong" });
//   }
// });

// browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
//   if (message === "check_installation") {
//     sendResponse({ isInstalled: true });
//   }
// });

// chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
//   if (message.action === "check") {
//     console.log("Checking if extension is installed...1------");

//     // Responding to content script
//     sendResponse({ installed: true });

//     return true; // Keep the message channel open for async response
//   }
// });
