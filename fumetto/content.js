(function() {
    // Impedisce esecuzioni multiple se il plugin viene cliccato più volte
    if (document.body.classList.contains('comic-mode-active')) {
      console.log("Modalità fumetto già attiva. Ricarica la pagina per convertire di nuovo.");
      alert("La modalità fumetto è già attiva. Se vuoi riconvertire, ricarica la pagina e premi nuovamente il pulsante del plugin.");
      return;
    }
  
    // URL dell'endpoint API.
    const API_ENDPOINT_URL = "https://groq-comic-api.onrender.com/api/generate_comic";
  
    // Selettori per identificare l'elemento articolo principale
    const ARTICLE_SELECTORS = [
      "article", "main", "div[role='main']",
      ".post-content", ".entry-content", ".td-post-content", ".single-post-content",
      ".article-content", ".article-body", ".content-area .post-content", ".content",
      "section[itemprop='articleBody']", "#main-content", "#main", "#content",
      "#primary .content-area", ".postBody", ".blog-post-content"
      
    ];
  
    // Funzione per verificare se un elemento è visibile
    function isElementVisible(el) {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' &&
             !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    }
  
    // Funzione per verificare se un elemento ha contenuto testuale significativo
    function hasSignificantContent(el) {
      if (!el) return false;
      const text = el.textContent.trim();
      if (text.length < 200) return false; // Minimo 200 caratteri
      const pCount = el.querySelectorAll('p').length;
      const imgCount = el.querySelectorAll('img').length;
      if (pCount < 1 && imgCount < 1 && text.length < 500) return false;
      return true;
    }
  
    // Funzione per escludere contenitori comuni non-articolo
    function isLikelyNonArticleContainer(el) {
      if (!el) return true;
      const idAndClasses = (el.id + ' ' + el.className).toLowerCase();
      const nonArticlePatterns = [
        'header', 'footer', 'sidebar', 'nav', 'menu', 'comments', 'comment-respond',
        'author-box', 'related-posts', 'ad', 'banner', 'widget', 'share', 'pagination',
        'breadcrumb', 'social', 'form', 'search', 'popup', 'modal'
      ];
      if (nonArticlePatterns.some(pattern => idAndClasses.includes(pattern))) return true;
      if (el.closest('header, footer, nav, aside')) return true;
      return false;
    }
  
    // Funzione principale per trovare l'elemento articolo
    function findMainArticleElement() {
      for (const selector of ARTICLE_SELECTORS) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (element && isElementVisible(element) && hasSignificantContent(element) && !isLikelyNonArticleContainer(element)) {
             let containsOtherMainCandidates = false;
             for (const innerSelector of ARTICLE_SELECTORS) {
                 if (selector === innerSelector) continue;
                 if (element.querySelector(innerSelector)) {
                     containsOtherMainCandidates = true;
                     break;
                 }
             }
             if (!containsOtherMainCandidates) {
                 console.log("Articolo principale trovato:", element, "con selettore:", selector);
                 return element;
             }
          }
        }
      }
      // Fallback: cerca il contenitore più grande con testo significativo che non sia body/html
      let bestFallbackCandidate = null;
      let maxScore = 0;
      document.querySelectorAll('div, section, main, article').forEach(el => {
          if (isElementVisible(el) && !isLikelyNonArticleContainer(el) && !el.closest('header, footer, nav, aside')) {
              const textLength = el.innerText?.trim().length || 0;
              const pCount = el.querySelectorAll('p').length;
              const score = textLength + (pCount * 100); // Semplice euristica di punteggio
              if (score > 500 && score > maxScore) { // Minimo 500 di punteggio per fallback
                  let containsOtherMainCandidates = false;
                  for (const innerSelector of ARTICLE_SELECTORS) {
                      if (el.querySelector(innerSelector)) {
                          containsOtherMainCandidates = true;
                          break;
                      }
                  }
                  if(!containsOtherMainCandidates) {
                      maxScore = score;
                      bestFallbackCandidate = el;
                  }
              }
          }
      });
      if (bestFallbackCandidate) {
          console.log("Articolo principale trovato con fallback euristico:", bestFallbackCandidate, "Score:", maxScore);
          return bestFallbackCandidate;
      }
      console.warn("Nessun elemento articolo principale identificato.");
      return null;
    }
  
    // Semplice sanificazione HTML per rimuovere script e attributi 'on*'
    function sanitizeHtml(htmlString) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlString;
      tempDiv.querySelectorAll('script, style, iframe, object, embed, link[rel="stylesheet"]').forEach(el => el.remove());
      const allElements = tempDiv.querySelectorAll('*');
      allElements.forEach(el => {
          for (let i = el.attributes.length - 1; i >= 0; i--) {
              const attrName = el.attributes[i].name.toLowerCase();
              if (attrName.startsWith('on')) {
                  el.removeAttribute(el.attributes[i].name);
              }
          }
      });
      return tempDiv.innerHTML;
    }
  
    // Funzione per chiamare l'API esterna e ottenere i dati del fumetto
    async function fetchComicDataFromAPI(articleText) {
      console.log("Invio testo all'API:", API_ENDPOINT_URL);
      const loadingIndicator = document.createElement('div');
      loadingIndicator.id = 'comic-loading-indicator'; // Per facilitare la rimozione
      loadingIndicator.textContent = "🎨 Sto generando il tuo fumetto con Groq... attendi un momento...";
      // Stili per l'indicatore di caricamento (puoi personalizzarli nel tuo style.css)
      loadingIndicator.style.cssText = `
          position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
          padding: 15px 25px; background: #ffda77; color: #333; border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 20000; font-size: 1.1em;
          font-family: 'Comic Neue', 'Comic Sans MS', cursive; border: 2px solid #e0a800;
          text-align: center;
      `;
      document.body.appendChild(loadingIndicator);
  
      try {
        const response = await fetch(API_ENDPOINT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            
          },
          body: JSON.stringify({ article_text: articleText }) 
        });
  
        if (!response.ok) {
          let errorDetails = `Errore API: \${response.status} \${response.statusText}`;
          try {
              const errorData = await response.json(); // Tenta di leggere il corpo dell'errore JSON
              errorDetails += ` - \${errorData.error || JSON.stringify(errorData)}`;
          } catch (e) {
              // Se il corpo dell'errore non è JSON, usa il testo grezzo se disponibile
              const textError = await response.text();
              if (textError) errorDetails += ` - \${textError}`;
          }
          console.error(errorDetails);
          throw new Error(errorDetails);
        }
  
        const data = await response.json();
        console.log("Dati ricevuti dall'API:", data);
  
        // Verifica che 'data' abbia la struttura attesa, es. data.panels
        if (data && data.panels && Array.isArray(data.panels)) {
          return data.panels; // Restituisce l'array di pannelli
        } else {
          console.error("Formato dati API non valido o pannelli mancanti:", data);
          throw new Error("Formato dati API non valido o pannelli mancanti.");
        }
      } catch (error) {
        console.error("Errore durante la chiamata API:", error);
        alert(`Errore nella comunicazione con il servizio di fumetti: \${error.message}`);
        return null; // Restituisce null in caso di errore
      } finally {
          const indicator = document.getElementById('comic-loading-indicator');
          if (indicator) indicator.remove(); // Rimuovi l'indicatore di caricamento
      }
    }
  
    // Crea l'interfaccia utente del fumetto
    function createComicUI(panelsDataFromAPI, originalArticleElement) {
      if (!panelsDataFromAPI || panelsDataFromAPI.length === 0) {
        alert("Il servizio non ha restituito dati validi per i pannelli del fumetto.");
        return null;
      }
  
      const comicContainer = document.createElement("div");
      comicContainer.className = "comic-strip-container";
      comicContainer.setAttribute('aria-live', 'polite');
  
      panelsDataFromAPI.forEach((panel, index) => {
        const panelElement = document.createElement("div");
        panelElement.className = "comic-panel";
        panelElement.setAttribute('role', 'region');
        panelElement.setAttribute('aria-labelledby', `comic-panel-title-\${index}`);
        panelElement.style.animationDelay = `\${index * 0.15}s`; // Staggering animation
  
        const titleElement = document.createElement("div");
        titleElement.className = "comic-panel-title";
        titleElement.id = `comic-panel-title-\${index}`;
        titleElement.textContent = panel.title || "Pannello"; // Titolo dal JSON dell'API
        panelElement.appendChild(titleElement);
  
        const contentElement = document.createElement("div");
        contentElement.className = "comic-panel-content";
        // Sanifica il contenuto ricevuto dall'API, specialmente se può essere HTML
        contentElement.innerHTML = sanitizeHtml(panel.content || "Nessun contenuto fornito.");
        panelElement.appendChild(contentElement);
  
        comicContainer.appendChild(panelElement);
      });
      return comicContainer;
    }
  
    // Funzione principale che orchestra la conversione
    async function convertToComic() {
      console.log("Avvio conversione in fumetto (via API)...");
      const articleElement = findMainArticleElement();
  
      if (!articleElement) {
        alert("Impossibile identificare l'articolo principale della pagina. Prova su una pagina con un articolo o blog post più definito.");
        return;
      }
  
      // Estrai testo semplice. 
      const articleText = articleElement.innerText || articleElement.textContent;
      if (!articleText || articleText.trim().length < 50) { // Minimo 50 caratteri
          alert("Il testo dell'articolo è troppo corto per essere processato.");
          return;
      }
  
      const panelsData = await fetchComicDataFromAPI(articleText);
  
      if (!panelsData) {
        // L'alert di errore è già gestito in fetchComicDataFromAPI
        return;
      }
  
      const articleParent = articleElement.parentNode;
      const articleNextSibling = articleElement.nextSibling;
  
      const comicUI = createComicUI(panelsData, articleElement);
  
      if (comicUI) {
        // Nascondi l'articolo originale
        articleElement.classList.add("original-article-hidden-by-comic");
        articleElement.setAttribute('data-original-article-id', 'comic-original-article-placeholder');
        articleElement.setAttribute('aria-hidden', 'true');
  
        // Inserisci il fumetto nel DOM prima dell'articolo originale o come suo fratello
        if (articleNextSibling) {
            articleParent.insertBefore(comicUI, articleNextSibling);
        } else {
            articleParent.appendChild(comicUI);
        }
  
        document.body.classList.add('comic-mode-active');
        console.log("Conversione in fumetto completata e UI inserita.");
  
        // Scrolla per rendere visibile l'inizio del fumetto
        comicUI.scrollIntoView({behavior: "smooth", block: "start"});
  
        // Aggiungi un pulsante per ripristinare l'articolo originale
        const restoreButton = document.createElement('button');
        restoreButton.textContent = "📚 Ripristina Articolo Originale 📚";
        // Lo stile del bottone dovrebbe essere in style.css, ma alcuni stili base inline per fallback
        restoreButton.style.cssText = `
          display: block; margin: 30px auto 10px auto !important;
          padding: 12px 25px !important;
          font-family: 'Bangers', 'Impact', sans-serif !important; font-size: 1.3em !important;
          background-color: #2ecc71 !important; color: white !important;
          border: none !important; border-radius: 8px !important;
          border-bottom: 3px solid #27ae60 !important; cursor: pointer !important;
          text-shadow: 1px 1px 0px #27ae60;
        `;
        restoreButton.onclick = () => {
          const original = document.querySelector('[data-original-article-id="comic-original-article-placeholder"]');
          if (original) {
            original.classList.remove('original-article-hidden-by-comic');
            original.removeAttribute('aria-hidden');
            original.removeAttribute('data-original-article-id');
          }
          if (comicUI && comicUI.parentNode) { // Controlla se comicUI è ancora nel DOM
              comicUI.remove();
          }
          if (restoreButton && restoreButton.parentNode) { // Controlla se restoreButton è ancora nel DOM
              restoreButton.remove();
          }
          document.body.classList.remove('comic-mode-active');
          console.log("Articolo originale ripristinato.");
        };
        // Inserisci il bottone prima del fumetto (o dopo, a seconda delle preferenze)
        comicUI.parentNode.insertBefore(restoreButton, comicUI);
      }
    }
  
    // Avvia la conversione
    convertToComic();
  
  })();