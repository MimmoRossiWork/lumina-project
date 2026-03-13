const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema per la singola risposta
const RispostaSchema = new Schema({
  id_domanda: { type: Number, required: true },
  testo: { type: String, required: true },
  voto: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  }
});

// Schema per il questionario completo
const QuestionarioSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId, // usa Schema.Types.ObjectId se gli utenti sono memorizzati in MongoDB
    ref: 'User',
    required: true,
    index: true // indice per velocizzare la ricerca per utente
  },
  data_compilazione: {
    type: Date,
    default: Date.now
  },
  risposte: [RispostaSchema]
});

// Creazione del Modello
const Questionario = mongoose.model('Questionario', QuestionarioSchema);

module.exports = Questionario;