# MyNotary Public API Demo

Ce projet représente une version simplifiée de la création d'un contrat depuis l'outil métier.

On peut voir les actions nécessaires pour afficher les types de dossiers et contrats disponibles ainsi que la création
d'un contrat à partir d'un bien.

L'UX est volontairement simpliste car ce n'est pas l'objectif principal.

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

## Récupérer les honoraires

Les honoraires peuvent être fixes ou en pourcentage et modifier dans un avenant tout comme le prix de vente. Voici une fonction utilitaire qui gère les différents scénarios possibles :

```typescript
type OperationAnswer = {
  mandat_avenant_type?: Array<'avenant_prix' | 'avenant_honoraires' | 'avenant_libre'>;
  mandat_honoraires_charge?: 'honoraires_charge_vendeur' | 'honoraires_charge_acquereur' | 'honoraires_charge_double';
  mandat_honoraires_montant?: number;
  mandat_nouveau_honoraires_montant?: number;
  mandat_numero?: string;
  mandat_numero_transaction?: string;
  mandat_pourcentage_honoraires_vente_total?: number;
  mandat_pourcentage_nouveau_honoraires_vente_total?: number;
  mandat_vente_calcul?: 'recherche_pourcentage' | 'recherche_fixe';
  nouveau_prix_de_vente?: number;
  prix_vente_total?: number;
};

const getPrixVente = (answer: OperationAnswer) => {
  if (answer.mandat_avenant_type?.includes('avenant_prix') && answer.nouveau_prix_de_vente != null) {
    return answer.nouveau_prix_de_vente;
  }
  return answer.prix_vente_total;
};

/**
 * Retourne les honoraires en montant fixe en fonction des réponses.
 *
 * cas 1: un avenant avec modification d'honoraire fixe
 * cas 2: un avenant avec modification d'honoraire en pourcentage
 * cas 3: pas d'avenant, honoraires fixe
 * cas 4: pas d'avenant, honoraires en pourcentage
 *
 * @param answer les réponses du dossier
 */
const getHonoraire = (answer: OperationAnswer): number | undefined => {
  const prixVente = getPrixVente(answer);

  if (
    answer.mandat_avenant_type?.includes('avenant_honoraires') &&
    answer.mandat_vente_calcul === 'recherche_fixe' &&
    answer.mandat_nouveau_honoraires_montant != null
  ) {
    return answer.mandat_nouveau_honoraires_montant;
  } else if (
    answer.mandat_avenant_type?.includes('avenant_honoraires') &&
    answer.mandat_vente_calcul === 'recherche_pourcentage' &&
    answer.mandat_pourcentage_nouveau_honoraires_vente_total != null &&
    prixVente != null
  ) {
    return (prixVente * answer.mandat_pourcentage_nouveau_honoraires_vente_total) / 100;
  } else if (answer.mandat_vente_calcul === 'recherche_fixe' && answer.mandat_honoraires_montant != null) {
    return answer.mandat_honoraires_montant;
  } else if (
    answer.mandat_vente_calcul === 'recherche_pourcentage' &&
    answer.mandat_pourcentage_honoraires_vente_total != null &&
    prixVente != null
  ) {
    return (prixVente * answer.mandat_pourcentage_honoraires_vente_total) / 100;
  }
  return undefined;
};

type LegalOperationType =
  | 'OPERATION__TROIS_G_IMMO__TROIS_G_IMMO_LOCATION_BIENS_PROFESSIONNELS'
  | 'OPERATION__TROIS_G_IMMO__TROIS_G_IMMO_LOCATION_HABITATION'
  | 'OPERATION__TROIS_G_IMMO__TROIS_G_IMMO_VENTE_ANCIEN'
  | 'OPERATION__TROIS_G_IMMO__TROIS_G_IMMO_VENTE_BIENS_PROFESSIONNELS'
  | 'OPERATION__TROIS_G_IMMO__TROIS_G_IMMO_VIAGER';

const getNumeroMandat = (answer: OperationAnswer, legalOperationType: LegalOperationType): string | undefined => {
  if (
    legalOperationType === 'OPERATION__TROIS_G_IMMO__TROIS_G_IMMO_LOCATION_BIENS_PROFESSIONNELS' ||
    legalOperationType === 'OPERATION__TROIS_G_IMMO__TROIS_G_IMMO_LOCATION_HABITATION'
  ) {
    return answer.mandat_numero_transaction;
  }

  return answer.mandat_numero;
};
```

