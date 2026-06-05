/*
 * Background Service Worker - Font Rendering Extension
 * Handles message passing between popup and content scripts
 */

// Single message handler for all communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getConfig") {
    // Get current config from storage
    chrome.storage.local.get(null, (data) => {
      sendResponse(data);
    });
    return true; // async response
  }

  if (message.action === "saveConfig") {
    // Save config to storage and broadcast to all tabs
    chrome.storage.local.set(message.config, () => {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              action: "updateConfig",
              config: message.config
            }).catch(() => {});
          }
        });
      });
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === "getAvailableFonts" && sender.tab?.id) {
    // Forward font request to content script
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "requestFonts"
    }, (response) => {
      sendResponse(response);
    });
    return true;
  }

  if (message.action === "applyToCurrentTab") {
    // Apply config to current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "updateConfig",
          config: message.config
        }).catch(() => {});
      }
    });
    sendResponse({ success: true });
  }

  // Forward from content script back to popup (font list)
  if (message.action === "getAvailableFonts" && message.fonts) {
    sendResponse({ fonts: message.fonts });
  }
});
