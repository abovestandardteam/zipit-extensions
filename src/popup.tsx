// popup.tsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./popup.css"; // Importing CSS file
import "./Fonts/fonts.css"; // Importing CSS file
import { environment } from "./environment";

const Popup: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [steamLoginSecure, setSteamLoginSecure] = useState<string | null>(null);

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
      const sessionIDMatch = /g_sessionID\s*=\s*"([a-zA-Z0-9]+)"/.exec(body);

   

      if (!match || match.length < 2) {
        setIsLoggedIn(false);
        setSteamLoginSecure(null);
        throw new Error("Failed to parse web API token.");
      }

      const token = match[1];
      setSteamLoginSecure(token);
      const steamID = extractSteamID(body);
      if (!steamID || !sessionIDMatch?.[1]) {
        throw new Error("Failed to extract steamID or sessionID");
      }
      setIsLoggedIn(true);
      const req = {
        steamloginsecure: `${steamID + "||" + token}`,
        steamid: steamID,
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

      // Store the token in Chrome storage
      chrome.storage.local.set({ [`steamToken`]: { token: token, steamID: steamID } }, () => {
        console.log("Steam API token saved.");
      });
    } catch (error) {
      console.error("Error fetching Steam token:", error);
    }
  }

  // useEffect(() => {
  //   const checkExtension = (extensionId: string): void => {
  //     if (chrome.runtime) {
  //       chrome.runtime.sendMessage(extensionId, { action: "check" }, () => {
  //         if (chrome.runtime.lastError) {
  //           console.log("Extension not installed");
  //         } else {
  //           console.log("Extension installed");
  //         }
  //       });
  //     } else {
  //       console.log("Chrome runtime not available");
  //     }
  //   };

  //   // Replace with your extension's ID
  //   checkExtension("dkgeeggphoecgekcidocioljiajlipkj");
  // }, []);

  function extractSteamID(body: string): string | null {
    const steamIDMatch = /g_steamID = "(\d+?)"/.exec(body);
    if (!steamIDMatch || steamIDMatch.length === 0) {
      return null;
    }

    return steamIDMatch[1];
  }

  useEffect(() => {
    fetchSteamToken();
    // chrome.storage.local.get("steamToken", (data) => {
    //   console.log(data, "data");

    //   if (data.steamToken) {
    //     setSteamLoginSecure(data.steamToken);
    //     setIsLoggedIn(false);
    //   } else {
    //     setSteamLoginSecure(null);
    //   }
    // });
  }, []);

  const handleLogin = () => {
    chrome.tabs.create({ url: environment.zipit_login });
  };

  return (
    <div className='popup-container'>
      <div className='zipit-logo'>
        <img src='/img/zipit_logo.svg' alt='' />
      </div>
      {isLoggedIn === null ? (
        <p>Checking login status...</p>
      ) : steamLoginSecure ? (
        <p>Welcome to Zipit </p>
      ) : (
        <button onClick={handleLogin} className='login-button'>
          <svg width='28' height='29' viewBox='0 0 28 29' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path
              d='M0.571538 18.0388C2.30265 23.8109 7.65666 28.02 13.9922 28.02C21.7297 28.02 28.0022 21.7475 28.0022 14.01C28.0022 6.27254 21.7297 0 13.9922 0C6.56782 0 0.492294 5.77606 0.0124512 13.0792C0.920474 14.6015 1.27291 15.5432 0.570662 18.0388H0.571538Z'
              fill='white'
            ></path>
            <path
              d='M13.27 10.5011L13.2714 10.5702L9.84328 15.5504C9.28814 15.525 8.73124 15.6226 8.20236 15.8402C7.97214 15.9338 7.75232 16.0511 7.54652 16.1904L0.0183336 13.0877C0.0183336 13.0877 -0.155916 15.9536 0.569977 18.0892L5.89203 20.2853C6.15471 21.4797 6.9778 22.5269 8.18704 23.0304C9.13838 23.4257 10.2077 23.4272 11.1602 23.0347C12.1127 22.6421 12.8704 21.8876 13.267 20.9368C13.4785 20.4303 13.5806 19.8848 13.5664 19.3361L18.4669 15.8314L18.5873 15.8336C21.5228 15.8336 23.9089 13.4405 23.9089 10.5011C23.9089 7.5616 21.5272 5.17727 18.5873 5.17114C15.6531 5.17114 13.2657 7.5616 13.2657 10.5011H13.27ZM12.447 20.5926C11.8104 22.125 10.0539 22.8461 8.52722 22.2099C7.84976 21.9252 7.30063 21.4013 6.98437 20.738L8.71679 21.456C8.98442 21.5674 9.27137 21.625 9.56126 21.6255C9.85114 21.6259 10.1383 21.5693 10.4063 21.4587C10.6742 21.3482 10.9178 21.1859 11.123 20.9812C11.3283 20.7764 11.4912 20.5333 11.6024 20.2656C11.8277 19.7247 11.829 19.1165 11.6061 18.5746C11.3832 18.0328 10.9544 17.6015 10.4138 17.3756L8.61872 16.6335C9.30959 16.3708 10.095 16.3621 10.8297 16.6672C11.574 16.975 12.1431 17.5547 12.4478 18.2959C12.7525 19.0371 12.7508 19.8545 12.4435 20.5926M18.5921 14.0539C17.6514 14.0514 16.7501 13.6761 16.0856 13.0104C15.4211 12.3446 15.0475 11.4426 15.0467 10.5019C15.0477 9.56144 15.4214 8.65967 16.0859 7.9941C16.7504 7.32853 17.6516 6.9534 18.5921 6.95085C19.5327 6.95317 20.4341 7.3282 21.0988 7.99379C21.7635 8.65939 22.1373 9.56129 22.1384 10.5019C22.1376 11.4428 21.7639 12.3449 21.0991 13.0107C20.4344 13.6765 19.5329 14.0516 18.5921 14.0539ZM15.9354 10.4963C15.9349 9.78949 16.2149 9.11142 16.7141 8.61104C17.2132 8.11067 17.8906 7.82895 18.5973 7.82779C20.0662 7.82779 21.261 9.02302 21.261 10.4963C21.2613 11.2032 20.9809 11.8813 20.4815 12.3815C19.982 12.8818 19.3043 13.1632 18.5973 13.1638C17.8907 13.1628 17.2133 12.8813 16.7141 12.3811C16.2149 11.8809 15.9351 11.2029 15.9354 10.4963Z'
              fill='url(#paint0_linear_3994_178)'
            ></path>
            <defs>
              <linearGradient
                id='paint0_linear_3994_178'
                x1='24.5413'
                y1='15.3273'
                x2='2.82636'
                y2='19.5344'
                gradientUnits='userSpaceOnUse'
              >
                <stop stop-color='#7000FF'></stop>
                <stop offset='1' stop-color='#AB2FFE'></stop>
              </linearGradient>
            </defs>
          </svg>
          Login with Steam
        </button>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(<Popup />);
