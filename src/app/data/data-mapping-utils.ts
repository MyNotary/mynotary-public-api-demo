import { databaseClient, House } from './database.client';
import {
  ContractNew,
  myNotaryApiClient,
  MyNotaryContact,
  MyNotaryHouse,
  OperationNew,
  RecordNew
} from './mynotary.client';
import { ORGANIZATION_ID, USER_ID } from '@/app/config';

/**
 * Cette fonction illustre l'importance de ne pas créer de doublons sur MyNotary.
 * L'application connectée doit conserver une association entre les entités créées sur MyNotary et les entités existantes
 * dans la base de données de l'outil connecté.
 */
export const findOrCreateRecord = async (args: { body: RecordNew; externalId: string }) => {
  let recordId = databaseClient.findMyNotaryRecordLocalDatabase(args.externalId);

  if (recordId == null) {
    const house = await myNotaryApiClient.postRecord(args.body);
    recordId = house.id;
    databaseClient.addAssociation({ type: 'RECORD', externalId: args.externalId, myNotaryId: house.id });
  }
  return recordId;
};

export function createPersonnePhysiqueBody(args: { email: string; prenoms: string; nom: string }): MyNotaryContact {
  return {
    creatorId: USER_ID,
    organizationId: ORGANIZATION_ID,
    type: 'RECORD__PERSONNE__PHYSIQUE',
    questions: {
      sexe: 'homme',
      nom: args.nom,
      prenoms: args.prenoms,
      informations_personnelles_date_naissance: 569977200000,
      informations_personnelles_ville_naissance: 'Paris',
      informations_personnelles_nationalite: 'FR',
      informations_personnelles_resident_fiscal: 'oui',
      informations_personnelles_profession: 'Professeur',
      email: args.email,
      adresse: {
        codePostal: '75001',
        ville: 'Paris',
        rue: '1 rue de Rivoli',
        pays: 'France'
      },
      telephone: '+33612345678'
    }
  };
}

export function createBienBody(selectedHouse: House): MyNotaryHouse {
  return {
    creatorId: USER_ID,
    organizationId: ORGANIZATION_ID,
    type: 'RECORD__BIEN__LOT_HABITATION',
    questions: {
      adresse: {
        codePostal: selectedHouse.address.zipCode,
        ville: selectedHouse.address.city,
        rue: selectedHouse.address.street,
        pays: selectedHouse.address.country
      },
      numero_lot: 'A1',
      designation: 'Appartement 1',
      nature_bien: 'nature_bien_appartement',
      occupation_statut: 'oui',
      occupation_location: 'location_bail',
      mesurage_carrez_statut: 'oui',
      mesurage_carrez_superficie: selectedHouse.surface,
      surface_habitable: 80
    }
  };
}

/**
 * Cette fonction retourne le body qui permet de créer un dossier.
 *
 * Le dossier va servir à faire le lien entre les différentes fiches utilisées dans le dossier (le bien, le vendeur, l'acquéreur...)
 * et les contrats (mandat, offre, compromis...).
 * Certaines de ces données sont réutilisables de dossier en dossier (les contacts et les biens principalement) et
 * d'autres sont propres au dossier. Les informations qui sont propres au dossier sont passées dans l'attribut `questions`
 * au moment de la création du dossier.
 */
export function createOperationBody(args: { selectedHouse: House; operationTypeId: string }): OperationNew {
  return {
    creatorId: USER_ID,
    organizationId: ORGANIZATION_ID,
    type: args.operationTypeId,
    questions: {
      mandat_tapuscrit: 'non',
      mandat_type: 'semi',
      mandat_numero: '8',
      mandat_semi_conditions: 'mandat_semi_agence_unique',
      mandat_cadastre: 'non',
      mandat_vente_calcul: 'recherche_fixe',
      mandat_honoraires_charge: 'honoraires_charge_vendeur',
      mandat_duree: 3,
      mandat_duree_recondution: 9,
      mandat_duree_recondution_totale: 12,
      mandant_statut: 'personnelles',
      mandat_frequence: 'systematique',
      mandat_recommande_electronique: 'oui',
      mandat_signature_electronique: 'oui',
      prix_vente_total: args.selectedHouse.price,

      // Exemple de champs utiles au contrat Tracfin
      presence_client_vendeur: 'oui',
      piece_identite_vendeur: 'cni',
      tracfin_age_vendeur_simple: 'oui',
      tracfin_luxe_vendeur_simple: 'oui',
      tracfin_observation_vendeur: 'oui',
      tracfin_prix_vendeur_simple: 'oui',
      tracfin_revenus_vendeur_simple: 'oui',
      tracfin_politique_vendeur_simple: 'oui',
      tracfin_profession_vendeur_simple: 'oui',
      tracfin_operation_anormale_vendeur: 'oui',
      tracfin_localisation_vendeur_simple: 'oui'
    }
  };
}

/**
 * De manière générale, les données ajoutées au dossier sont automatiquement récupérées dans les contrats,
 * et chaque contrat va filtrer ce dont il ne se sert pas.
 *
 * Cependant, il existe des cas particuliers pour lesquels il y a des données spécifiques à chaque contrat.
 * C'est le cas de l'offre d'achat, du bon de visite, du tracfin etc...
 * Par exemple, il peut y avoir plusieurs bons de visite dans un même dossier avec un visiteur et des horaires de visite
 * différents sur chaque bon de visite.
 *
 * Pour ces cas particuliers, c'est au moment de la création du contrat qu'on va ajouter les données spécifiques au contrat.
 * C'est ce qui est fait pour le bon de visite et l'offre d'achat dans cet exemple.
 */
export const createContractBody = async (args: {
  operationId: number;
  contractModelId: string;
  contractLabel: string;
}): Promise<ContractNew> => {
  const contractNew: ContractNew = {
    userId: USER_ID,
    operationId: args.operationId,
    type: args.contractModelId,
    label: args.contractLabel,
    records: {},
    questions: {}
  };

  if (args.contractModelId === 'IMMOBILIER_VENTE_ANCIEN_BON_VISITE') {
    const visiteurId = await findOrCreateRecord({
      body: createPersonnePhysiqueBody({
        email: 'jean-visiteur@gmail.com',
        prenoms: 'Jean',
        nom: 'VISITEUR'
      }),
      externalId: 'jean-visiteur@gmail.com'
    });

    contractNew.questions = {
      date_visite: new Date().getTime(),
      visite_electronique: 'oui'
    };
    contractNew.records = {
      VISITEUR: [visiteurId]
    };
  }

  if (args.contractModelId === 'IMMOBILIER_VENTE_ANCIEN_OFFRE_ACHAT') {
    const offrantId = await findOrCreateRecord({
      body: createPersonnePhysiqueBody({
        email: 'jean-offrant@gmail.com',
        prenoms: 'Jean',
        nom: 'OFFRANT'
      }),
      externalId: 'jean-offrant@gmail.com'
    });
    contractNew.questions = {
      offre_developpee: 'oui',
      offre_prix: 100000,
      offre_apport: 'oui',
      offre_apport_total: 50000,
      offre_emprunt: 'oui',
      offre_emprunt_total: 50000,
      offre_date_validite: new Date().getTime(),
      offre_date_extreme_signature: new Date().getTime()
    };
    contractNew.records = {
      OFFRANT: [offrantId]
    };
  }

  return contractNew;
};
