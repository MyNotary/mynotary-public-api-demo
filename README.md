# MyNotary Public API Demo

Ce projet représente une version simplifiée de la création d'un contrat depuis l'outil métier.

On peut voir les actions nécessaires pour afficher les types de dossiers et contrats disponibles ainsi que la création
d'un contrat à partir d'un bien.

L'UX est volontairement simpliste car ce n'est pas l'objectif principal.

## Structure du projet

- `src/app/database.client.ts`: Simule un client de base de données pour récupérer les données qui sont stockées dans la
  base de donnée de l'outil métier
- `src/app/mynotary.client.ts`: Simule un client pour l'API publique MyNotary. Il permet de récupérer les types de
  dossiers et contrats disponibles et de créer un contrat
  - `src/app/page.tsx`: Page principale de l'application. Elle affiche la liste des biens disponibles dans l'outil
    métier et permet de créer un contrat à partir d'un bien.

## Lancer le projet

1. Installer les dépendances:
   ```bash
   npm install
   ```
2. Lancer le serveur de développement:
   ```bash
   npm run dev
   ```

Vous pouvez mettre à jour les variables `ORGANIZATION_ID`, `USER_ID` et `API_KEY` dans le fichier `src/app/page.tsx`
avec les valeurs fournies par MyNotary.
