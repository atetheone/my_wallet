/** French dictionary. Single source of UI strings; `en.ts` can be added later. */
export const fr = {
  appName: "Xaalis",

  // lock
  lockTitle: "Code",
  lockSubtitle: "Entrez votre code à 4 chiffres",
  lockWrong: "Code incorrect",

  // onboarding
  obWelcome: "Bienvenue sur Xaalis",
  obIntro: "Configurons votre budget en quelques étapes.",
  obIncome: "Revenu fixe mensuel",
  obSalaryDay: "Jour de paie (1–31)",
  obSavings: "Épargne mensuelle engagée",
  obFixedCosts: "Charges fixes",
  obAddFixedCost: "Ajouter une charge",
  obFirstGoal: "Premier objectif d'épargne",
  obGoalName: "Nom de l'objectif",
  obGoalTarget: "Montant cible",
  obGoalDate: "Date cible",
  obFinish: "Terminer",
  obNext: "Suivant",
  obSkip: "Passer",

  // home
  safeToSpend: "Reste à dépenser",
  perDay: "par jour",
  daysLeft: "jours restants",
  overcommitted: "Épargne + charges dépassent le revenu",
  addExpense: "Ajouter une dépense",
  goalsTitle: "Objectifs",
  projected: "Atteint vers",
  noPace: "Aucune contribution",

  // quick add
  amount: "Montant",
  category: "Catégorie",
  method: "Moyen",
  cash: "Espèces",
  wave: "Wave",
  note: "Note (facultatif)",
  save: "Enregistrer",
  cancel: "Annuler",

  // history
  history: "Historique",
  byCategory: "Par catégorie",
  noExpenses: "Aucune dépense pour cette période",
  total: "Total",
  delete: "Supprimer",

  // goals
  addGoal: "Nouvel objectif",
  reached: "Atteint",
  remaining: "Restant",

  // settings
  settings: "Réglages",
  language: "Langue",
  exportData: "Exporter (JSON)",
  importData: "Importer (JSON)",
  sync: "Synchronisation",
  signIn: "Se connecter (lien magique)",
  signedInAs: "Connecté :",
  syncNow: "Synchroniser maintenant",
  setPin: "Définir un code",
  removePin: "Retirer le code",

  // generic
  required: "Requis",
  back: "Retour",
} as const;

export type Dict = typeof fr;
