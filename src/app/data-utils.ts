import { SpecfiqueContractInfo } from './components';
import { House } from './database.client';
import { ContractNew, MyNotaryContact, MyNotaryHouse, OperationNew, OperationRecordNew } from './mynotary.client';
import { ORGANIZATION_ID, USER_ID } from './page';

export function createVendeurBody(): MyNotaryContact {
  return {
    creatorId: USER_ID,
    organizationId: ORGANIZATION_ID,
    type: 'RECORD__PERSONNE__PHYSIQUE',
    questions: {
      sexe: 'homme',
      nom: 'Doe',
      prenoms: 'Jean-Michel',
      informations_personnelles_date_naissance: 569977200000,
      informations_personnelles_ville_naissance: 'Paris',
      informations_personnelles_nationalite: 'FR',
      informations_personnelles_resident_fiscal: 'oui',
      informations_personnelles_profession: 'Professeur',
      email: 'john.doe@gmail.com',
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

export function createOffrantBody(): MyNotaryContact {
  return {
    creatorId: USER_ID,
    organizationId: ORGANIZATION_ID,
    type: 'RECORD__PERSONNE__PHYSIQUE',
    questions: {
      sexe: 'homme',
      nom: 'Offrant',
      prenoms: 'Jean-Michel',
      informations_personnelles_date_naissance: 569977200000,
      informations_personnelles_ville_naissance: 'Paris',
      informations_personnelles_nationalite: 'FR',
      informations_personnelles_resident_fiscal: 'oui',
      informations_personnelles_profession: 'Professeur',
      email: 'john.doe@gmail.com',
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

export function createVisiteurBody(): MyNotaryContact {
  return {
    creatorId: USER_ID,
    organizationId: ORGANIZATION_ID,
    type: 'RECORD__PERSONNE__PHYSIQUE',
    questions: {
      sexe: 'homme',
      nom: 'Visiteur',
      prenoms: 'Jean-Michel',
      informations_personnelles_date_naissance: 569977200000,
      informations_personnelles_ville_naissance: 'Paris',
      informations_personnelles_nationalite: 'FR',
      informations_personnelles_resident_fiscal: 'oui',
      informations_personnelles_profession: 'Professeur',
      email: 'john.doe@gmail.com',
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

export function createDossierBody(operationTypeId: string): OperationNew {
  return {
    creatorId: USER_ID,
    organizationId: ORGANIZATION_ID,
    type: operationTypeId,
    questions: {}
  };
}

export function createOperationRecordBody(
  operationId: number,
  houseRecordId: number,
  contactRecordId: number
): OperationRecordNew {
  return {
    operationId,
    operationRecords: {
      BIEN_VENDU: [houseRecordId],
      VENDEUR: [contactRecordId]
    }
  };
}

export function createContractBody(
  operationId: number,
  contractModelId: string,
  specficContractInfo: SpecfiqueContractInfo | null
): ContractNew {
  return {
    userId: USER_ID,
    operationId,
    type: contractModelId,
    label: `${contractModelId} (n'oubliez pas de renommer le contrat)`,
    questions: specficContractInfo?.questions,
    records: specficContractInfo?.records
  };
}
