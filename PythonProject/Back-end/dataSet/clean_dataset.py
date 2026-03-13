import pandas as pd
import re

def pulisci_testo(testo):
    # 1. Rimuove i Link (http o https)
    testo = re.sub(r'http\S+', '', testo)
    # 2. Rimuove le Menzioni (@nomeutente)
    testo = re.sub(r'@\S+', '', testo)
    # 3. Rimuove il simbolo Hashtag # (ma tiene la parola)
    testo = testo.replace('#', '')
    # 4. Rimuove spazi doppi o spazi all'inizio/fine
    testo = re.sub(r'\s+', ' ', testo).strip()
    return testo

def pulisci_label(label):
    # Prende solo la prima parola prima dello spazio
    # Es: "joy (R)" diventa "joy"
    return label.split()[0]

# --- ESECUZIONE ---
print("Caricamento dataset...")
# Assicurati che il file si chiami 'feel_it_dataset.csv'
df = pd.read_csv('feel_it_dataset.csv')

# Applichiamo la pulizia
df['text'] = df['text'].apply(pulisci_testo)
df['emotion'] = df['labels'].apply(pulisci_label)

# Selezioniamo solo le colonne che ci servono
df_pulito = df[['text', 'emotion']]

# Salviamo il nuovo file
output_file = 'clean_feel.csv'
df_pulito.to_csv(output_file, index=False)

print(f"Fatto! Dataset pulito salvato come: {output_file}")
print("Prime 5 righe del nuovo dataset:")
print(df_pulito.head())