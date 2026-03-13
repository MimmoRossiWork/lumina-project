import pandas as pd
import numpy as np
import random

# Seed per riproducibilità
np.random.seed(42)
random.seed(42)

NUM_SAMPLES = 1000

print(f"Generazione di {NUM_SAMPLES} giornate simulate con dati completi...")

# 1. GENERAZIONE DATI
# Simuliamo correlazioni realistiche (es. chi ha ansia alta spesso ha stress alto)

stress = np.random.randint(1, 11, NUM_SAMPLES)
# L'ansia è spesso legata allo stress ma può variare
anxiety = []
for s in stress:
    # Se stress è alto, ansia tende ad essere alta
    base = s + random.randint(-2, 2)
    anxiety.append(max(1, min(10, base)))  # Tieni tra 1 e 10

steps = np.random.normal(6500, 3000, NUM_SAMPLES).astype(int)
steps = [max(0, x) for x in steps]

# Minuti attivi correlati ai passi (circa 1 min ogni 100 passi + varianza)
active_minutes = []
for s in steps:
    mins = int(s / 110) + random.randint(-10, 30)
    active_minutes.append(max(0, mins))

# Calorie mangiate (Media 2200, deviazione 500)
calories_intake = np.random.normal(2200, 500, NUM_SAMPLES).astype(int)

# Caffeina (0-6 tazze)
caffeine = np.random.choice([0, 1, 2, 3, 4, 5], NUM_SAMPLES, p=[0.15, 0.25, 0.3, 0.15, 0.1, 0.05])

# Emozioni (distribuzione casuale)
emotions_list = ['joy', 'neutral', 'sadness', 'anger', 'fear']
ai_emotion = np.random.choice(emotions_list, NUM_SAMPLES, p=[0.3, 0.3, 0.15, 0.15, 0.1])

# 2. CREAZIONE DATAFRAME
df = pd.DataFrame({
    'stress_level': stress,
    'anxiety_level': anxiety,
    'steps': steps,
    'active_minutes': active_minutes,
    'calories_intake': calories_intake,
    'caffeine': caffeine,
    'ai_emotion': ai_emotion
})


# 3. LOGICA DEL TARGET (RISCHIO SONNO)
# Qui definiamo le regole che l'IA dovrà imparare.
# 0 = Dormirà Bene (Low Risk)
# 1 = Dormirà Male (High Risk)

def calculate_sleep_risk(row):
    risk_score = 0

    # --- FATTORI NEGATIVI (Aumentano il rischio) ---

    # Ansia e Stress pesano tantissimo
    if row['anxiety_level'] >= 7: risk_score += 30
    if row['stress_level'] >= 7: risk_score += 20

    # Troppa caffeina
    if row['caffeine'] >= 3: risk_score += 15
    if row['caffeine'] >= 5: risk_score += 10  # Bonus penalità

    # Mangiare troppo (Digestione pesante)
    if row['calories_intake'] > 2800: risk_score += 15

    # Emozioni negative (Battito accelerato/Pensieri intrusivi)
    if row['ai_emotion'] in ['anger', 'fear']: risk_score += 25
    if row['ai_emotion'] == 'sadness': risk_score += 10

    # --- FATTORI POSITIVI (Riducono il rischio) ---

    # Attività fisica (stanca il corpo in modo sano)
    if row['active_minutes'] > 45: risk_score -= 15
    if row['steps'] > 8000: risk_score -= 10

    # Emozioni positive
    if row['ai_emotion'] == 'joy': risk_score -= 10

    # Rumore casuale (imprevedibilità umana)
    risk_score += random.randint(-5, 5)

    # --- SOGLIA ---
    # Se il punteggio di rischio supera 40, allora è una notte a rischio
    if risk_score >= 40:
        return 1
    else:
        return 0


df['sleep_risk'] = df.apply(calculate_sleep_risk, axis=1)

# 4. SALVATAGGIO
csv_name = 'sleep_risk_dataset_advanced.csv'
df.to_csv(csv_name, index=False)

print(f"✅ Dataset generato: {csv_name}")
print(f"Esempio dati:\n{df.head(3)}")
print("\nBilanciamento Classi (0 vs 1):")
print(df['sleep_risk'].value_counts())