chrome.action.onClicked.addListener((tab) => {
    if (tab.url && (tab.url.startsWith("http://") || tab.url.startsWith("https://"))) {
      chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["style.css"]
      }).then(() => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"]
        }).catch(err => console.error("Errore nell'eseguire content.js:", err));
      }).catch(err => console.error("Errore nell'inserire style.css:", err));
    } else {
      console.log("Il plugin può essere eseguito solo su pagine http o https.");
    }
  });