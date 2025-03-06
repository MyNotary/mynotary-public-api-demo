# MyNotary Public API Demo

Ce projet représente une version simplifiée de la création d'un contrat depuis l'outil métier.

On peut voir les actions nécessaires pour afficher les types de dossiers et contrats disponibles ainsi que la création
d'un contrat à partir d'un bien.

L'UX est volontairement simpliste car ce n'est pas l'objectif principal.

## Structure du projet

## Structure du projet

- `src/app/components/contract-list-dialog.tsx` : Composant de dialogue permettant de sélectionner un type de dossier et
  un type de contrat. Les types de dossiers et les contrats associés sont récupérés depuis l'API MyNotary.
- `src/app/components/snackbars.tsx` : Composant pour afficher des notifications (snackbars) indiquant l'état de la
  création du contrat (en cours, terminée, erreur).
- `src/app/data/database.client.ts` : Simule un client de base de données pour récupérer et stocker les données dans la
  base de données de l'outil métier. Il permet également de gérer les associations entre les entités de l'application
  externe et MyNotary.
- `src/app/data/mynotary.client.ts` : Client pour l'API publique MyNotary. Il permet de récupérer les types de dossiers
  et contrats disponibles, de créer des fiches, des opérations et des contrats, et d'associer des fiches à des
  opérations.
- `src/app/data/data-mapping-utils.ts` : Contient des fonctions utilitaires pour créer le body des fiches, des
  opérations et des contrats, ainsi que pour éviter les doublons en trouvant ou en créant des enregistrements.
- `src/app/page.tsx` : Page principale de l'application. Elle affiche la liste des biens disponibles dans l'outil métier
  et permet de créer un contrat à partir d'un bien sélectionné. Elle gère également le processus de création des fiches,
  des opérations et des contrats.
- `src/app/config.ts` : Contient les constantes de configuration telles que `ORGANIZATION_ID`, `API_KEY` et `USER_ID`
  nécessaires pour interagir avec l'API MyNotary.

## Lancer le projet

1. Installer les dépendances:
   ```bash
   npm install
   ```
2. Lancer le serveur de développement:
   ```bash
   npm run dev
   ```

Les valeurs fournies dans `config.ts` permettent déjà d'utiliser le projet mais vous pouvez mettre à jour les variables
`ORGANIZATION_ID`, `USER_ID` et `API_KEY` dans le fichier `src/app/page.tsx` avec les valeurs fournies par MyNotary.
