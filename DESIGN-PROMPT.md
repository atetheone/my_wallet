# Xaalis — Claude design prompt

Design a mobile-first PWA called **Xaalis** — a personal expense + savings app.
French UI. Currency is XOF/FCFA (integer amounts, no decimals, format like
"12 500 FCFA"). Single user, used primarily one-handed on an Android phone.
Design these 7 screens:

1. **Verrouillage** — 4-digit PIN entry to unlock the app.
2. **Configuration (onboarding)** — multi-step: revenu fixe mensuel; jour de
   paie (1–31); épargne mensuelle engagée; liste des charges fixes (libellé +
   montant + jour); premier objectif d'épargne (nom, montant cible, date cible).
3. **Accueil (home)** — one large hero number: « Reste à dépenser » for the rest
   of the period; secondary line: allocation journalière; progress card(s) for
   savings goal(s) with progress bar + projected completion date; prominent
   button to add an expense.
4. **Ajouter une dépense (quick-add)** — large numeric keypad first (amount),
   then category picker, a cash/Wave toggle, optional note; confirm in one tap.
   Must feel sub-5-second.
5. **Historique** — chronological list of expenses (date, category, amount,
   method); monthly summary grouped by category with totals.
6. **Objectifs** — list of savings goals with progress, required pace, projected
   date; add/edit a goal.
7. **Réglages** — edit income, salary day, savings commitment, fixed costs, PIN;
   JSON export/import; cloud sync status + magic-link sign-in.

Categories (French): Nourriture, Transport, Logement, Santé, Loisirs, Famille,
Divers. Methods: Espèces, Wave. Deliver all 7 screens.
