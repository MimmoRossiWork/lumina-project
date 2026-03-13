from pathlib import Path
import logging
from typing import Optional, Dict

import joblib

try:
    import numpy as _np
except Exception:
    _np = None

logger = logging.getLogger(__name__)


class EmotionalAI:
    """Carica un modello sklearn salvato con joblib e fornisce analyze(text).

    Decisioni:
    - Non loggare né salvare il testo (privacy).
    - Restituire confidence solo se predict_proba è disponibile (Option B).
    - Tags in italiano tramite mappa di parole chiave.
    """

    def __init__(self, model_path: Optional[Path] = None):
        if model_path is None:
            # percorso relativo alla cartella Back-end
            model_path = Path(__file__).resolve().parent / "dataSet" / "lumina_emotion_model.pkl"
        self.model_path = Path(model_path)
        self.model = None
        self._load_model()

        # mappa di keyword in italiano -> tag
        # case-insensitive
        self.keyword_map = {
            "Lavoro": ["lavor", "ufficio", "colleg", "progett", "manager"],
            "Sport": ["palestr", "corsa", "correre", "allenam","allena", "nuoto", "yoga", "cammin", "calcio"],
            "Sonno": ["sonno", "dormire", "stanco", "sveglia", "szveglio","ripos"],
            "Salute": ["malattia", "dolore", "febbre", "medico", "infortunio"],
            "Relazioni": ["amore", "famigli", "marit", "moglie", "amici", "fidanzato", "fidanzata"],
            "Cibo": ["mangia", "diet", "cib", "colazione", "pranzo", "cena", "spuntino", "snack", "nutrizion", "alimentazion"],
            "Stress": ["stress", "ansia", "preoccup", "nervos"],
            "SonnoOver": ["insonnia", "dormo poco", "dormita"],
        }

    def _load_model(self):
        try:
            if not self.model_path.exists():
                logger.warning("EmotionalAI: model file not found at %s", str(self.model_path))
                self.model = None
                return
            # joblib.load may raise, handle defensively
            self.model = joblib.load(self.model_path)
            logger.info("EmotionalAI: modello caricato correttamente da %s", str(self.model_path))
        except Exception as e:
            logger.exception("EmotionalAI: errore caricamento modello: %s", e)
            self.model = None

    def analyze(self, text: str) -> Dict[str, object]:
        """Analizza il testo e restituisce emotion, confidence (solo se disponibile) e tags.

        Non loggare il testo per privacy.
        """
        result = {
            "emotion": "unknown",
            "confidence": None,
            "tags": [],
        }

        # tags: estrazione indipendente dal modello
        tags = set()
        try:
            txt = (text or "").lower()
            for tag, keywords in self.keyword_map.items():
                for kw in keywords:
                    if kw in txt:
                        tags.add(tag)
                        break
        except Exception:
            # non fallire l'intera analisi per un problema di parsing
            tags = set()

        result["tags"] = sorted(list(tags))

        # se non abbiamo il modello, ritorniamo i tag trovati e emotion unknown
        if self.model is None:
            return result

        # uso il modello in modo difensivo
        try:
            # alcuni pipeline accettano array-like di stringhe
            pred = self.model.predict([text])
            # normalize different container types (list/tuple/numpy.ndarray)
            emotion_val = None
            try:
                if isinstance(pred, (list, tuple)):
                    emotion_val = pred[0]
                elif _np is not None and isinstance(pred, _np.ndarray):
                    emotion_val = pred[0]
                else:
                    emotion_val = pred
            except Exception:
                emotion_val = pred

            # ensure emotion_val is a plain string
            try:
                if isinstance(emotion_val, str):
                    emotion_str = emotion_val
                else:
                    # fallback to str conversion
                    emotion_str = str(emotion_val)
                # strip list-like string forms if present (e.g. "['joy']")
                if emotion_str.startswith("[") and emotion_str.endswith("]"):
                    # remove brackets and quotes
                    emotion_str = emotion_str.strip("[] \"\'")
                result["emotion"] = emotion_str
            except Exception:
                result["emotion"] = str(emotion_val)

            # confidence solo se predict_proba disponibile
            try:
                if hasattr(self.model, "predict_proba"):
                    probs = self.model.predict_proba([text])
                    if probs is not None and len(probs) > 0:
                        p0 = probs[0]
                        max_idx = int(p0.argmax())
                        confidence = float(p0[max_idx])
                        result["confidence"] = confidence
                    else:
                        result["confidence"] = None
                else:
                    result["confidence"] = None
            except Exception:
                result["confidence"] = None

        except Exception:
            # in caso di errore di prediction, restituire fallback con tags
            result["emotion"] = "unknown"
            result["confidence"] = None

        return result


# singleton factory
_emotional_ai_instance: Optional[EmotionalAI] = None


def get_emotional_ai() -> EmotionalAI:
    global _emotional_ai_instance
    if _emotional_ai_instance is None:
        _emotional_ai_instance = EmotionalAI()
    return _emotional_ai_instance
