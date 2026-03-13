import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report
import joblib

# 1. Carica il dataset generato
print("Caricamento dataset...")
df = pd.read_csv('sleep_risk_dataset_advanced.csv')

# 2. Separa Input (X) e Output (y)
X = df.drop('sleep_risk', axis=1) # Tutte le colonne tranne il target
y = df['sleep_risk']              # Solo la colonna target (0 o 1)

# 3. Preparazione dei dati (Preprocessing)
# L'IA non capisce le stringhe come "joy" o "anger". Dobbiamo tradurle.
# Usiamo una Pipeline che fa tutto in automatico.

categorical_features = ['ai_emotion']
numeric_features = ['stress_level', 'anxiety_level', 'steps', 'active_minutes', 'calories_intake', 'caffeine']

# ColumnTransformer applica trasformazioni diverse a colonne diverse
preprocessor = ColumnTransformer(
    transformers=[
        ('num', 'passthrough', numeric_features), # I numeri restano numeri
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features) # Le stringhe diventano vettori numerici
    ])

# 4. Costruzione della Pipeline (Trasformazione + Modello)
# Questo "tubo" prende i dati grezzi, li pulisce e li passa al Random Forest
model = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# 5. Divisione Training (80%) e Test (20%)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 6. Addestramento
print("🏋️‍♂️ Addestramento del modello in corso...")
model.fit(X_train, y_train)

# 7. Valutazione
print("Valutazione...")
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"\n✅ Accuratezza raggiunta: {accuracy*100:.2f}%")
print("\nReport Classificazione:")
print(classification_report(y_test, y_pred))

# 8. Salvataggio del modello
model_filename = 'lumina_sleep_model.pkl'
joblib.dump(model, model_filename)
print(f"\n💾 Modello salvato in: {model_filename}")

# --- TEST DI PROVA ---
# Vediamo se funziona subito con un esempio finto
print("\n--- TEST RAPIDO ---")
test_user = pd.DataFrame({
    'stress_level': [8],
    'anxiety_level': [7],
    'steps': [2000],          # Pochi passi
    'active_minutes': [10],   # Poca attività
    'calories_intake': [2500],
    'caffeine': [4],          # Troppi caffè
    'ai_emotion': ['anger']   # Arrabbiato
})

prediction = model.predict(test_user)[0]
result = "RISCHIO ALTO (Dormirai male)" if prediction == 1 else "RISCHIO BASSO (Dormirai bene)"
print(f"Utente Test (Stressato e Sedentario): {result}")