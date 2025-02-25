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

// Listen for the alarm and fetch the token
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "fetchSteamTokenAlarm") {
    fetchSteamToken();
  }
});

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

        // if (data.steamToken && sender.tab?.id) {
        //   chrome.scripting.executeScript({
        //     target: { tabId: sender.tab.id },
        //     func: (token: string) => {
        //       window.postMessage({ steamToken: token }, "*");
        //     },
        //     args: [data.steamToken],
        //   });
        // }
      });
    }

    return true;
  }
);
