const mongoose = require('mongoose');

const { Schema } = mongoose;

const QuestionnaireSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    sectionScores: {
      nutriOmics: { type: Number, default: 0 },
      physioOmics: { type: Number, default: 0 },
      psychoOmics: { type: Number, default: 0 },
      socioOmics: { type: Number, default: 0 },
      ecoOmics: { type: Number, default: 0 },
      lifeOmics: { type: Number, default: 0 },
    },
    totalScore: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Questionnaire', QuestionnaireSchema);

