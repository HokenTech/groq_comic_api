import os
import json
from flask import Flask, request, jsonify
from groq import Groq
from dotenv import load_dotenv

# Carica le variabili d'ambiente dal file .env (per sviluppo locale)
load_dotenv()

app = Flask(__name__)

# Inizializza il client Groq
# Assicurati che la variabile d'ambiente GROQ_API_KEY sia impostata
# Su Render, la imposterai tramite la dashboard di Render.
try:
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError("La variabile d'ambiente GROQ_API_KEY non è impostata.")
    client = Groq(api_key=groq_api_key)
except Exception as e:
    print(f"Errore durante l'inizializzazione del client Groq: {e}")
    client = None # Gestisci lo stato in cui il client non può essere inizializzato

# Questo prompt è cruciale. Dovrai sperimentare per ottenere i risultati migliori.
# Chiediamo a Groq di restituire un JSON strutturato.
COMIC_PANEL_PROMPT_SYSTEM = """
Sei un assistente esperto nel trasformare testi di articoli in dati strutturati per pannelli di fumetti.
Il tuo compito è analizzare il testo fornito e dividerlo in una sequenza logica di pannelli.
Per ogni pannello, devi fornire:
1. Un "title" (titolo) conciso e accattivante per il pannello.
2. Un "content" (contenuto) che riassume il testo di quella sezione in modo adatto a una vignetta di un fumetto (breve, diretto, informativo o dialogico).

IMPORTANTE: La tua risposta DEVE essere ESCLUSIVAMENTE un oggetto JSON valido che contiene una singola chiave "panels".
Il valore della chiave "panels" deve essere una lista di oggetti JSON, dove ogni oggetto rappresenta un pannello
e ha le chiavi "title" (stringa) e "content" (stringa).
Non includere NESSUN testo, spiegazione, commento o markdown prima o dopo l'oggetto JSON.

Esempio di output JSON atteso:
{
  "panels": [
    {
      "title": "Introduzione al Problema",
      "content": "Il mondo affronta una nuova sfida..."
    },
    {
      "title": "La Proposta di Soluzione",
      "content": "Un team di scienziati ha un'idea brillante!"
    },
    {
      "title": "Sviluppi Chiave",
      "content": "Dopo esperimenti intensi, i primi risultati sono promettenti."
    }
  ]
}
"""

@app.route('/api/generate_comic', methods=['POST'])
def generate_comic_panels():
    if not client:
        return jsonify({"error": "Client Groq non inizializzato correttamente. Controlla la chiave API."}), 500

    data = request.get_json()
    if not data or 'article_text' not in data:
        return jsonify({"error": "Richiesta malformata. 'article_text' mancante."}), 400

    article_text = data['article_text']

    if not article_text.strip():
        return jsonify({"error": "'article_text' non può essere vuoto."}), 400

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": COMIC_PANEL_PROMPT_SYSTEM
                },
                {
                    "role": "user",
                    "content": f"Analizza il seguente testo dell'articolo e strutturalo in pannelli di fumetto come specificato:\n\n---ARTICOLO---\n{article_text}\n---FINE ARTICOLO---"
                }
            ],
            model="mixtral-8x7b-32768", # Puoi provare anche "llama3-70b-8192" o altri modelli disponibili
            temperature=0.5,         # Sperimenta con la temperatura
            # max_tokens=2048,       # Adatta se necessario
            # top_p=1,
            # stop=None, # Non necessario se il prompt è chiaro sul formato JSON
            response_format={"type": "json_object"} # Chiede esplicitamente un output JSON
        )

        response_content = chat_completion.choices[0].message.content
        
        # Tenta di parsare il contenuto come JSON
        # Groq dovrebbe restituire un JSON valido grazie a response_format e al prompt
        parsed_json = json.loads(response_content)

        # Verifica che il JSON abbia la struttura attesa
        if "panels" not in parsed_json or not isinstance(parsed_json["panels"], list):
            print(f"Errore: L'output dell'LLM non conteneva una lista 'panels' valida. Output: {response_content}")
            return jsonify({"error": "L'LLM non ha restituito dati dei pannelli nel formato atteso.", "raw_output": response_content}), 500
        
        # Verifica che ogni pannello abbia 'title' e 'content'
        for panel in parsed_json["panels"]:
            if not isinstance(panel, dict) or "title" not in panel or "content" not in panel:
                print(f"Errore: Pannello malformato. Output: {response_content}")
                return jsonify({"error": "Uno o più pannelli restituiti dall'LLM erano malformati.", "raw_output": response_content}), 500


        return jsonify(parsed_json) # Restituisce l'intero oggetto JSON { "panels": [...] }

    except json.JSONDecodeError as e:
        print(f"Errore di decodifica JSON: {e}. Output LLM: {response_content}")
        return jsonify({"error": "L'LLM non ha restituito un JSON valido.", "raw_output": response_content}), 500
    except Exception as e:
        print(f"Errore durante la chiamata a Groq o l'elaborazione: {e}")
        # Potresti voler loggare l'errore in modo più dettagliato qui
        return jsonify({"error": f"Errore interno del server: {str(e)}"}), 500

@app.route('/')
def home():
    return "API per la generazione di fumetti con Groq è in esecuzione!"

if __name__ == '__main__':
    # Esegue Flask in modalità debug solo localmente
    app.run(debug=True, port=5001) # Usa una porta diversa se la 5000 è occupata
