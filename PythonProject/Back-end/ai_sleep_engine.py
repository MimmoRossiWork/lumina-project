import joblib
import pandas as pd
import os
import logging
from pathlib import Path

# Configurazione Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SleepPredictorAI:
    """
    Gestisce la previsione della qualità del sonno basandosi
    sul modello Random Forest addestrato.
    """

    MODEL_FILENAME = "lumina_sleep_model.pkl"

    def __init__(self):
        # Percorso dinamico: cerca nella cartella dataSet
        self.model_path = Path(__file__).resolve().parent / "dataSet" / self.MODEL_FILENAME
        self.model = None
        self._load_model()

    def _load_model(self):
        """Carica il modello .pkl da disco."""
        try:
            if not self.model_path.exists():
                logger.error(f"❌ Modello Sonno NON trovato in: {self.model_path}")
                return

            self.model = joblib.load(self.model_path)
            logger.info(f"✅ Modello Sonno caricato con successo!")
        except Exception as e:
            logger.error(f"❌ Errore caricamento modello sonno: {e}")

    def predict_risk(self, stress, anxiety, steps, active_minutes, calories, caffeine, ai_emotion):
        """
        Prevede il rischio sonno.
        Input: Dati dell'utente di oggi.
        Output:
            0 -> Basso Rischio (Dormirai bene)
            1 -> Alto Rischio (Dormirai male)
            None -> Errore
        """
        if self.model is None:
            logger.warning("Tentativo di predizione con modello non caricato.")
            return None

        try:
            # 1. Creiamo un DataFrame pandas con UNA sola riga.
            # IMPORTANTE: I nomi delle colonne devono essere IDENTICI al CSV di training.
            input_data = pd.DataFrame({
                'stress_level': [stress],
                'anxiety_level': [anxiety],
                'steps': [steps],
                'active_minutes': [active_minutes],
                'calories_intake': [calories],
                'caffeine': [caffeine],
                'ai_emotion': [ai_emotion]  # Es. 'joy', 'anger', 'neutral'
            })

            # 2. Facciamo la predizione
            prediction = self.model.predict(input_data)[0]

            # Restituisce 0 o 1
            return int(prediction)

        except Exception as e:
            logger.error(f"Errore durante la predizione sonno: {e}")
            return None


# Singleton per non ricaricare il modello ogni volta
_sleep_ai_instance = None


def get_sleep_predictor():
    global _sleep_ai_instance
    if _sleep_ai_instance is None:
        _sleep_ai_instance = SleepPredictorAI()
    return _sleep_ai_instance


# --- TEST RAPIDO (Eseguilo da terminale) ---
if __name__ == "__main__":
    ai = get_sleep_predictor()
    # Proviamo un caso pessimo: Stress alto, 5 caffè, niente sport, rabbia
    rischio = ai.predict_risk(
        stress=9,
        anxiety=8,
        steps=1000,
        active_minutes=0,
        calories=3000,
        caffeine=5,
        ai_emotion="anger"
    )
    print(f"Esito Test (0=Bene, 1=Male): {rischio}")
