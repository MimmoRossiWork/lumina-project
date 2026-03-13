import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import make_pipeline
from sklearn.metrics import accuracy_score, classification_report
import joblib

# 1. CARICAMENTO
print("Leggo il dataset pulito...")
try:
    df = pd.read_csv('clean_feel.csv')
    df = df.dropna()
except FileNotFoundError:
    print("ERRORE: File non trovato.")
    exit()

X = df['text']
y = df['emotion']

# Dividiamo training e test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 2. CREAZIONE MODELLO (SVM invece di Naive Bayes)
# LinearSVC è ottimo per il testo.
model = make_pipeline(
    TfidfVectorizer(ngram_range=(1, 2)), # Guarda parole singole E coppie (bigrams)
    LinearSVC(class_weight='balanced', random_state=42)
)
# 3. ADDESTRAMENTO
print("Addestramento SVM in corso... (Più potente!)")
model.fit(X_train, y_train)

# 4. VALUTAZIONE
print("Calcolo l'accuratezza...")
predicted = model.predict(X_test)
accuracy = accuracy_score(y_test, predicted)

print(f"✅ Accuratezza modello: {accuracy:.2%}")
print("\n--- Report Dettagliato ---")
print(classification_report(y_test, predicted))

# 5. SALVATAGGIO
nome_file = 'lumina_emotion_model.pkl'
joblib.dump(model, nome_file)
print(f"💾 Modello salvato: {nome_file}")

# 6. TEST UTENTE
print("\n--- TEST FINALE ---")
frasi_test = [
    "Sono così felice di aver finito il progetto!",
    "Ho paura che andrà tutto male.",
    "Questa situazione mi fa impazzire di rabbia.",
    "Mi sento giù di morale oggi, voglio solo piangere."
]
preds = model.predict(frasi_test)
for frase, emozione in zip(frasi_test, preds):
    print(f"Frase: '{frase}' -> {emozione.upper()}")