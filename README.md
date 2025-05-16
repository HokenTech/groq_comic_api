# Convertitore Articolo in Fumetto (con Groq API)

Questo progetto consiste in un'estensione per Google Chrome e qualsiasi browser basato su Chrome, e un servizio backend API che, insieme, trasformano articoli web in un formato fumetto, utilizzando la potenza dell'API Groq per l'elaborazione del linguaggio naturale e la generazione dei contenuti dei pannelli.

## Indice

1.  [Panoramica](#panoramica)
2.  [Funzionalità](#funzionalità)
3.  [Architettura](#architettura)
    *   [Plugin Chrome (Frontend)](#plugin-chrome-frontend)
    *   [Backend API (Python/Flask su Render.com)](#backend-api-pythonflask-su-rendercom)
4.  [Setup e Installazione](#setup-e-installazione)
    *   [Prerequisiti](#prerequisiti)
    *   [Configurazione del Backend API](#configurazione-del-backend-api)
    *   [Installazione del Plugin Chrome](#installazione-del-plugin-chrome)
5.  [Dettagli del Codice](#dettagli-del-codice)
    *   [Plugin Chrome (`content.js`, `background.js`, `manifest.json`)](#plugin-chrome-contentjs-backgroundjs-manifestjson)
    *   [Backend API (`app.py`)](#backend-api-apppy)
6.  [Personalizzazione](#personalizzazione)
    *   [Migliorare l'estrazione dell'articolo](#migliorare-lestrazione-dellarticolo)
    *   [Affinare il Prompt di Groq](#affinare-il-prompt-di-groq)
    *   [Modificare lo Stile del Fumetto](#modificare-lo-stile-del-fumetto)
7.  [Troubleshooting](#troubleshooting)
8.  [Contributi](#contributi)
9.  [Licenza](#licenza)

---

## 1. Panoramica

L'obiettivo di questo progetto è fornire un modo innovativo e divertente per consumare contenuti testuali online. Cliccando sull'icona dell'estensione, l'articolo principale della pagina web attiva viene inviato a un backend API. Il backend utilizza l'API di Groq per suddividere il testo in pannelli di fumetto, generando un titolo e un contenuto per ciascuno. Questi dati strutturati vengono quindi restituiti al plugin, che renderizza dinamicamente il fumetto sulla pagina, nascondendo l'articolo originale.

---

## 2. Funzionalità

*   **Conversione one-click:** Trasforma gli articoli in fumetti con un singolo click sull'icona del plugin.
*   **Estrazione intelligente del contenuto:** Tenta di identificare automaticamente l'elemento articolo principale della pagina.
*   **Elaborazione AI con Groq:** Sfrutta modelli linguistici potenti tramite Groq per generare i pannelli del fumetto.
*   **Rendering dinamico:** Il fumetto viene visualizzato direttamente sulla pagina corrente.
*   **Ripristino dell'articolo:** Un pulsante permette di tornare facilmente alla visualizzazione dell'articolo originale.
*   **Feedback visivo:** Un indicatore di caricamento informa l'utente durante l'elaborazione.

---

## 3. Architettura

Il sistema è composto da due parti principali:

### Plugin Chrome (Frontend)

L'estensione del browser è responsabile dell'interazione con l'utente e della manipolazione del DOM della pagina web.
*   **`manifest.json`**: Definisce i metadati del plugin, i permessi necessari (accesso alla tab attiva, scripting, accesso all'endpoint API del backend), le icone e lo script di background.
*   **`background.js`**: Ascolta l'evento di click sull'icona del plugin. Quando attivato, inietta lo script `content.js` (e opzionalmente `style.css`) nella pagina web attiva.
*   **`content.js`**: È il cuore della logica frontend. Una volta injettato:
    1.  Identifica e estrae il testo dell'articolo principale dalla pagina.
    2.  Mostra un indicatore di caricamento.
    3.  Invia il testo dell'articolo all'endpoint del backend API tramite una richiesta `fetch` (POST).
    4.  Riceve la risposta JSON dal backend (contenente i pannelli del fumetto).
    5.  Rimuove l'indicatore di caricamento.
    6.  Crea dinamicamente gli elementi HTML per il fumetto (pannelli, titoli, contenuti).
    7.  Nasconde l'articolo originale e visualizza il fumetto.
    8.  Aggiunge un pulsante per ripristinare l'articolo originale.
*   **`style.css`**: Contiene gli stili CSS per l'aspetto del fumetto (contenitore, pannelli, titoli, testo) e per l'indicatore di caricamento.

### Backend API (Python/Flask su Render.com)

Un semplice servizio web costruito con Python e Flask, ospitato su Render.com, che funge da intermediario tra il plugin e l'API di Groq.
*   **`app.py`**:
    1.  Definisce un endpoint API (es. `/api/generate_comic`) che accetta richieste `POST`.
    2.  Utilizza `Flask-CORS` per abilitare le richieste Cross-Origin Resource Sharing, permettendo al plugin Chrome (che opera su domini diversi) di comunicare con l'API.
    3.  Recupera la chiave API di Groq dalle variabili d'ambiente del server (configurate su Render.com).
    4.  Inizializza il client Python di Groq.
    5.  Riceve il testo dell'articolo dal corpo della richiesta JSON inviata da `content.js`.
    6.  Costruisce un prompt specifico per Groq, istruendolo a trasformare il testo in una struttura JSON di pannelli di fumetto (ognuno con un `title` e un `content`).
    7.  Effettua una chiamata all'API di Groq (endpoint `chat.completions.create`), inviando il prompt e il testo dell'articolo.
    8.  Riceve la risposta da Groq.
    9.  Parifica la risposta (che dovrebbe essere una stringa JSON) in un oggetto Python.
    10. Esegue validazioni sulla struttura del JSON ricevuto (presenza di `panels`, ecc.).
    11. Restituisce i dati dei pannelli al plugin come risposta JSON.
    12. Gestisce eventuali errori durante il processo.
*   **`requirements.txt`**: Elenca le dipendenze Python del progetto (Flask, Groq, python-dotenv, gunicorn, Flask-CORS).
*   **`gunicorn`**: Usato come server WSGI per eseguire l'applicazione Flask in produzione su Render.com.

---

## 4. Setup e Installazione

### Prerequisiti

*   Google Chrome installato o browser che è basato su Chrome (Brave).
*   Un account [Groq](https://console.groq.com/) per ottenere una chiave API.
*   Un account [Render.com](https://render.com/) (o un'altra piattaforma di hosting per servizi web Python).
*   Git installato.
*   Python 3.x e pip installati per lo sviluppo locale del backend.

### Configurazione del Backend API

1.  **Clonare il Repository (o creare i file):**
    Se stai partendo da un repository, clonalo. Altrimenti, crea una cartella per il backend e aggiungi i file `app.py`, `requirements.txt`.

2.  **Ottenere una Chiave API Groq:**
    *   Vai su [console.groq.com](https://console.groq.com/).
    *   Registrati/Accedi e crea una nuova chiave API dalla sezione "API Keys".
    *   **Conserva questa chiave in modo sicuro.**

3.  **Sviluppo Locale (Opzionale ma Raccomandato):**
    *   Crea e attiva un ambiente virtuale Python:
        ```bash
        python -m venv venv
        source venv/bin/activate  # Su Windows: venv\Scripts\activate
        ```
    *   Installa le dipendenze:
        ```bash
        pip install -r requirements.txt
        ```
    *   Crea un file `.env` nella root del progetto backend (aggiungilo a `.gitignore`!):
        ```env
        GROQ_API_KEY="gsk_TUA_CHIAVE_API_SEGRETA_GROQ"
        ```
    *   Esegui l'app Flask localmente:
        ```bash
        python app.py
        ```
        L'API sarà tipicamente disponibile su `http://127.0.0.1:5001`. Testa l'endpoint `/api/generate_comic` con uno strumento come Postman o curl.

4.  **Deploy su Render.com:**
    *   Assicurati che il tuo codice backend sia in un repository Git (es. GitHub, GitLab).
    *   Su Render.com, crea un nuovo "Web Service".
    *   Collega il tuo repository Git.
    *   **Configurazioni del Servizio:**
        *   **Runtime:** Python 3
        *   **Build Command:** `pip install -r requirements.txt`
        *   **Start Command:** `gunicorn app:app` (dove `app.py` è il file principale e `app` è l'istanza Flask)
    *   **Variabili d'Ambiente su Render:**
        *   Aggiungi una variabile d'ambiente `GROQ_API_KEY` con il valore della tua chiave API Groq.
        *   (Opzionale) Imposta `PYTHON_VERSION` se necessario.
    *   Avvia il deploy. Una volta completato, Render ti fornirà un URL pubblico per la tua API (es. `https://tuo-servizio.onrender.com`). Prendi nota di questo URL.

### Installazione del Plugin Chrome

1.  **Preparare i File del Plugin:**
    Assicurati di avere i file `manifest.json`, `background.js`, `content.js` e `style.css` in una directory dedicata.

2.  **Aggiornare `manifest.json` e `content.js`:**
    *   Nel file `manifest.json`, nella sezione `host_permissions`, assicurati che l'URL del tuo backend API deployato su Render sia presente:
        ```json
        "host_permissions": [
          "https://TUO_SERVIZIO.onrender.com/*"
        ]
        ```
    *   Nel file `content.js`, aggiorna la costante `API_ENDPOINT_URL` con l'URL completo del tuo endpoint API su Render (incluso il percorso `/api/generate_comic` o quello che hai definito):
        ```javascript
        const API_ENDPOINT_URL = "https://TUO_SERVIZIO.onrender.com/api/generate_comic";
        ```

3.  **Caricare il Plugin in Chrome:**
    *   Apri Google Chrome e vai a `chrome://extensions/`.
    *   Attiva la "Modalità sviluppatore" (interruttore in alto a destra).
    *   Clicca su "Carica estensione non pacchettizzata".
    *   Seleziona la cartella che contiene i file del tuo plugin.
    *   L'estensione dovrebbe apparire nella lista.

4.  **Testare:**
    Vai su una pagina web con un articolo, clicca sull'icona del plugin e verifica che funzioni!

---

## 5. Dettagli del Codice

### Plugin Chrome (`content.js`, `background.js`, `manifest.json`)

*   **`manifest.json`**:
    *   `manifest_version: 3`: Specifica l'uso di Manifest V3.
    *   `name`, `version`, `description`: Metadati di base.
    *   `permissions`: Richiede `activeTab` per interagire con la pagina corrente e `scripting` per injettare `content.js`.
    *   `host_permissions`: Cruciale; concede il permesso di fare richieste all'URL del backend API. Senza questo, le chiamate `fetch` verrebbero bloccate.
    *   `background.service_worker`: Specifica lo script di background.
    *   `action`: Definisce il comportamento dell'icona del plugin nella barra degli strumenti.
    *   `(Opzionale) content_scripts`: Può essere usato per injettare CSS globalmente. Se `content.js` è injettato programmaticamente, non è necessario includerlo qui.
    *   `(Opzionale) web_accessible_resources`: Necessario se `content.js` deve accedere a risorse locali del plugin come font o immagini.

*   **`background.js`**:
    *   Utilizza `chrome.action.onClicked.addListener` per rilevare quando l'utente clicca sull'icona del plugin.
    *   Chiama `chrome.scripting.executeScript` per injettare dinamicamente `content.js` nella tab attiva. Questo approccio "on-demand" è efficiente perché lo script viene caricato solo quando serve.

*   **`content.js`**:
    *   **IIFE (Immediately Invoked Function Expression)**: Il codice è racchiuso in `(function() { ... })();` per evitare di inquinare lo scope globale della pagina web.
    *   **`API_ENDPOINT_URL`**: Costante che memorizza l'URL del backend.
    *   **Logica di Estrazione dell'Articolo (`findMainArticleElement`)**:
        *   Utilizza una lista di selettori CSS comuni (`ARTICLE_SELECTORS`) per cercare elementi come `<article>`, `<main>`, o `div` con classi specifiche.
        *   Implementa controlli per la visibilità, la quantità di contenuto testuale significativo e per escludere sezioni non pertinenti (header, footer, commenti).
    *   **Comunicazione API (`fetchComicDataFromAPI`)**:
        *   Asincrona (`async/await`).
        *   Mostra/nasconde un indicatore di caricamento.
        *   Effettua una richiesta `POST` all' `API_ENDPOINT_URL`.
        *   Imposta l'header `Content-Type` a `application/json`.
        *   Invia il testo dell'articolo nel corpo della richiesta come oggetto JSON: `{ "article_text": "..." }`.
        *   Gestisce la risposta: verifica lo status, parsa il JSON, e controlla la struttura attesa (`data.panels`).
        *   Implementa la gestione degli errori (problemi di rete, errori HTTP, formato dati non valido).
    *   **Creazione UI (`createComicUI`)**:
        *   Riceve l'array `panelsDataFromAPI`.
        *   Crea dinamicamente elementi `div` per il contenitore del fumetto e per ogni pannello.
        *   Popola i pannelli con `title` e `content` ricevuti dall'API.
        *   Utilizza `sanitizeHtml` per pulire il contenuto HTML proveniente dall'API prima di inserirlo nel DOM, prevenendo XSS.
    *   **Flusso Principale (`convertToComic`)**:
        *   Orchestra i passaggi: trova l'articolo, estrae il testo, chiama l'API, crea l'UI.
        *   Nasconde l'elemento articolo originale e inserisce l'UI del fumetto.
        *   Aggiunge un pulsante "Ripristina Articolo" che inverte le modifiche al DOM.
    *   **Prevenzione Esecuzioni Multiple**: Un controllo all'inizio impedisce al plugin di essere eseguito più volte sulla stessa pagina senza un ricaricamento.

### Backend API (`app.py`)

*   **Flask Setup**:
    *   `app = Flask(__name__)`: Crea l'istanza dell'applicazione Flask.
    *   `CORS(app)`: Inizializza `Flask-CORS` per permettere richieste cross-origin da qualsiasi dominio. Per produzione, si potrebbe restringere a domini specifici o all'ID dell'estensione Chrome.
*   **Inizializzazione Client Groq**:
    *   `groq_api_key = os.environ.get("GROQ_API_KEY")`: Recupera la chiave API dalle variabili d'ambiente (più sicuro che hardcodarla).
    *   `client = Groq(api_key=groq_api_key)`: Inizializza il client.
*   **Prompt di Sistema (`COMIC_PANEL_PROMPT_SYSTEM`)**:
    *   Questo è un testo cruciale che guida il modello Groq.
    *   Specifica il ruolo dell'assistente, il compito da svolgere e, soprattutto, il **formato JSON esatto** che ci si aspetta in output (un oggetto con una chiave `panels`, che è una lista di oggetti pannello, ognuno con `title` e `content`).
    *   L'uso di `response_format={"type": "json_object"}` nella chiamata a Groq (se il modello lo supporta) aiuta a forzare l'output JSON.
*   **Route API (`/api/generate_comic`)**:
    *   Decorata con `@app.route('/api/generate_comic', methods=['POST', 'OPTIONS'])`.
        *   `POST`: Per ricevere i dati dell'articolo.
        *   `OPTIONS`: Per gestire le richieste "preflight" CORS inviate dai browser prima di una richiesta `POST` cross-origin. `Flask-CORS` di solito gestisce queste automaticamente.
    *   **Validazione Input**: Controlla che la richiesta sia JSON e contenga `article_text`.
    *   **Chiamata a Groq**:
        *   `client.chat.completions.create(...)`: Effettua la chiamata all'API Groq.
        *   `messages`: Include il prompt di sistema e il prompt utente (che contiene il testo dell'articolo).
        *   `model`: Specifica il modello Groq da usare (es. `mixtral-8x7b-32768`).
        *   `temperature`: Controlla la casualità dell'output.
        *   `response_format={"type": "json_object"}`: Incoraggia Groq a restituire JSON.
    *   **Elaborazione Risposta**:
        *   Estrae il contenuto del messaggio dalla risposta di Groq.
        *   `json.loads(response_content)`: Tenta di parsare la stringa in un oggetto JSON.
        *   Verifica che il JSON parsato abbia la struttura attesa (`panels` come lista di oggetti con `title` e `content`).
    *   **Gestione Errori**: Blocchi `try...except` per catturare `json.JSONDecodeError` (se Groq non restituisce JSON valido), e altre eccezioni generali, restituendo risposte JSON di errore con status code appropriati (400, 500).
*   **Route Home (`/`)**: Un semplice endpoint `GET` per verificare che l'API sia in esecuzione.
*   **Esecuzione Gunicorn (per Render)**: Il comando `gunicorn app:app` è specificato su Render. Gunicorn è un server WSGI robusto per applicazioni Python in produzione.

---

## 6. Personalizzazione

### Migliorare l'estrazione dell'articolo (`content.js`)

*   Aggiungi più selettori a `ARTICLE_SELECTORS` per coprire layout di siti web specifici.
*   Affina le euristiche in `hasSignificantContent` o `isLikelyNonArticleContainer` per una migliore precisione.
*   Considera l'uso di librerie di "content extraction" più sofisticate se necessario (anche se questo aggiunge complessità).

### Affinare il Prompt di Groq (`app.py`)

Il `COMIC_PANEL_PROMPT_SYSTEM` è la leva più potente per cambiare la qualità e lo stile del fumetto.
*   **Sperimenta con il wording**: Sii più specifico sul tono (umoristico, serio, sarcastico), sullo stile dei dialoghi, sulla lunghezza dei pannelli.
*   **Aggiungi esempi "few-shot"**: Includi nel prompt esempi di testo di input e l'output JSON desiderato per guidare meglio il modello.
*   **Chiedi elementi aggiuntivi**: Potresti chiedere a Groq di suggerire anche descrizioni di immagini per i pannelli, se volessi estendere il plugin per generare immagini (es. con un'API text-to-image).
*   **Modelli Diversi**: Prova diversi modelli disponibili su Groq (es. `llama3-70b-8192`) per vedere quale produce i risultati migliori per il tuo caso d'uso. Ricorda che modelli diversi possono avere token limit e costi differenti.
*   **Parametri di Groq**: Modifica `temperature`, `max_tokens`, `top_p` nella chiamata a `client.chat.completions.create` per influenzare la creatività e la lunghezza dell'output.

### Modificare lo Stile del Fumetto (`style.css`)

*   Personalizza i font, i colori, i bordi, le spaziature dei pannelli e del testo.
*   Aggiungi sfondi o texture ai pannelli.
*   Migliora le animazioni o transizioni.
*   Usa font in stile fumetto (assicurati che siano accessibili via web o inclusi nel plugin e dichiarati in `web_accessible_resources`).

---

## 7. Troubleshooting

*   **Errore CORS**: Se vedi errori CORS nella console del browser, assicurati che:
    1.  Il backend API (Flask) abbia `Flask-CORS` configurato correttamente (`CORS(app)`).
    2.  Il `manifest.json` del plugin includa l'URL corretto del backend in `host_permissions`.
    3.  Stai usando `https://` se il tuo backend è servito su HTTPS.
*   **Errore 500 Internal Server Error dal Backend**:
    1.  **Controlla i log del servizio su Render.com**. Questo è il posto più importante per trovare i dettagli dell'errore Python.
    2.  Verifica che la variabile d'ambiente `GROQ_API_KEY` sia impostata correttamente su Render e che la chiave sia valida.
    3.  Assicurati che il modello Groq specificato sia corretto e accessibile.
    4.  Esamina il prompt inviato a Groq; un prompt malformato potrebbe causare errori.
*   **Il plugin non si attiva / `content.js` non viene eseguito**:
    1.  Verifica che `background.js` stia correttamente ascoltando `chrome.action.onClicked` e che `chrome.scripting.executeScript` venga chiamato senza errori.
    2.  Controlla la console di background del plugin (accessibile dalla pagina `chrome://extensions/` cliccando su "service worker" o link simile per la tua estensione).
*   **Articolo non trovato o estratto male**:
    1.  Apri la console del browser sulla pagina target e verifica quale elemento `content.js` sta identificando (o fallendo nel trovare).
    2.  Potrebbe essere necessario aggiungere o modificare i selettori in `ARTICLE_SELECTORS` in `content.js`.
*   **Output Groq non conforme**:
    1.  Se Groq restituisce JSON malformato o con una struttura diversa, dovrai affinare `COMIC_PANEL_PROMPT_SYSTEM` per essere più esplicito sul formato richiesto. L'uso di `response_format={"type": "json_object"}` aiuta molto.
    2.  Aggiungi più log nel backend per stampare la risposta grezza da Groq prima del parsing, per aiutare il debug.

---

## 8. Contributi

I contributi sono benvenuti! Sentiti libero di aprire issue per bug o richieste di funzionalità, o di sottoporre Pull Request.

---

## 9. Licenza

Copyright (c) [2025] [Hoken Tech]
Tutti i diritti riservati.
Non è consentita la riproduzione, la distribuzione o la creazione di opere derivate da questo software senza l'esplicito permesso scritto del detentore del copyright. Per richieste di permesso, contattare [hokentechitalia@gmail.com]
