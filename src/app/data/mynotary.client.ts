import axios from 'axios';

import { API_KEY } from '@/app/config';

/**
 * Client pour l'API MyNotary contenant les méthodes principales pour créer des fiches, des opérations et des contrats.
 * La documentation complète est accessible sur https://app.mynotary.fr/api/doc
 */
class MyNotaryApiClient {
  client;

  constructor(args: { apiKey: string }) {
    this.client = axios.create({
      baseURL: '/api/mynotary',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': args.apiKey
      }
    });
  }

  /**
   * Crée une fiche dans MyNotary.
   * Une fiche est un bien ou un contact.
   */
  async postRecord(args: RecordNew): Promise<Record> {
    const res = await this.client.post('/records', args);
    return res.data;
  }

  /**
   * Crée une opération dans MyNotary.
   * Une opération est un dossier contenant des contrats et des fiches.
   * Il n'est pas nécessaire d'ajouter les fiches agences ou mandataires car elles sont sauvegardées par défaut pour
   * tous les dossiers directement sur MyNotary
   */
  async postOperation(args: OperationNew): Promise<Operation> {
    const res = await this.client.post('/operations', args);
    return res.data;
  }

  /**
   * Permet d'associer des fiches a un dossier.
   * Les champs complétés dans les fiches viennent enrichir les clauses des contrats du dossier.
   */
  async postOperationRecords(args: OperationRecordNew): Promise<void> {
    await this.client.post(`/operations/${args.operationId}/records`, args.operationRecords);
  }

  /**
   * Récupère la lites des opérations et des contrats disponbiles dans une organisation.
   */
  async getOperationTypes(args: { organizationId: number }): Promise<OperationType[]> {
    const res = await this.client.get(`/organizations/operations`, {
      params: {
        organizationId: args.organizationId
      }
    });
    return res.data;
  }

  /**
   * Un dossier peut contenir plusieurs offre d'achat ou plusieurs bon de visite. Chaque contrat a un offrant ou un
   * visiteur différent.
   * Pour gérer ce cas la, les fiches sont associées lors de la création du contrat grâce à l'attribut records.
   */
  async postContract(args: ContractNew): Promise<Contract> {
    const res = await this.client.post('/contracts', args);
    return res.data;
  }

  async getLogin(args: { userId: number; operationId: number }): Promise<{ link: string }> {
    const res = await this.client.get('/login', { params: args });
    return res.data;
  }
}

/**
 * Represente un timestamp en millisecondes.
 * /eg 1612137600000
 */
export type Timestamp = number;

export type ContractSpecificQuestions = {
  /**
   * Dans la cas d'un bon de visite
   */

  /**
   * Date de versement du dernier loyer. Format : timestamp en millisecondes
   */
  date_visite?: Timestamp;
  /**
   * Signature électronique
   */
  visite_electronique?: YesNo;

  /**
   * Dans la cas d'une Offre d'achat
   */
  offre_developpee?: YesNo;
  /*
   * prix proposé de l'offre en euros
   */
  offre_prix?: number;
  /*
   * L'offre est t'elle financé par un apport personnel
   */
  offre_apport?: YesNo;
  /**
   * Montant de l'apport personnel
   */
  offre_apport_total?: number;

  /**
   * L'offre est t'elle financé par un emprunt
   */
  offre_emprunt?: YesNo;

  /**
   * Montant de l'emprunt
   */
  offre_emprunt_total?: number;

  /**
   * Date de validité de l'offre d'achat
   */
  offre_date_validite?: Timestamp;

  /**
   * Date de signature extrême de l'avant contrat
   */
  offre_date_extreme_signature?: Timestamp;
};

export interface ContractNew {
  operationId: number;
  label: string;
  type: string;
  records?: ContractRecord;
  userId: number;
  /**
   * Représente une fiche de bien à créer.
   */
  questions?: ContractSpecificQuestions;
}

export type OperationRecordNew = {
  operationRecords: OperationRecord;
  operationId: number;
};

interface MyNotaryAddress {
  numero?: string;
  rue?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
}

type YesNo = 'oui' | 'non';

/**
 * Représente une fiche de bien à créer.
 * Les champs listés sont ceux les plus couramment utilisés par les outils externes et représentent un taux de complétion
 * évelé des différents mandats de vente ou location.
 * Pour une liste complète des champs disponibles, se référer à la documentation de l'API et l'endpoint GET /records/description
 * ou en complétant un contrat depuis la plateforme et en inspectant le network pour voir l'id du champ.
 */
export interface MyNotaryHouse {
  type:
    | 'RECORD__BIEN__INDIVIDUEL_HABITATION'
    | 'RECORD__BIEN__INDIVIDUEL_HORS_HABITATION'
    | 'RECORD__BIEN__LOT_HABITATION'
    | 'RECORD__BIEN__LOT_HORS_HABITATION'
    | 'RECORD__BIEN__TERRAIN_CONSTRUCTIBLE'
    | 'RECORD__BIEN__TERRAIN_NON_CONSTRUCTIBLE';
  creatorId: number;
  organizationId: number;
  questions: {
    adresse?: MyNotaryAddress;

    /**
     * Numéro du lot
     */
    numero_lot?: string;

    /**
     * Désignation du bien
     */
    designation?: string;

    /**
     * Nature du bien.
     * Les valeurs possibles dépendent du type de bien. nature_bien_autre peut être utilisé pour faciliter le mapping
     * et renseigner n'importe quelle valeur sous forme de texte.
     * Valeurs possibles :
     * Si type = RECORD__BIEN__LOT_HABITATION
     * - nature_bien_appartement : Appartement
     * - nature_bien_duplex : Duplex
     * - nature_bien_triplex : Triplex
     * - nature_bien_maison : Maison en copropriété
     * Si type = RECORD__BIEN__LOT_HORS_HABITATION
     * - nature_bien_cave : Cave
     * - nature_bien_cellier : Cellier
     * - nature_bien_garage : Garage
     * - nature_bien_local: Un local commercial ou professionnel
     * - nature_bien_parking : Parking
     * Si type = RECORD__BIEN__INDIVIDUEL_HABITATION
     * - nature_maison : Maison
     * - nature_mitoyen : Maison mitoyenne
     * - nature_immeuble : Immeuble entier
     * Si type = RECORD__BIEN__INDIVIDUEL_HORS_HABITATION
     * - nature_garage : Un garage
     * - nature_bien_commercial : Un local commercial ou professionnel
     * Pour tous les types de bien :
     * - autre: Permet de renseigner n'importe quel valeur sous forme de texte dans nature_bien_autre.
     */
    nature_bien?:
      | 'nature_bien_appartement'
      | 'nature_bien_duplex'
      | 'nature_bien_triplex'
      | 'nature_bien_maison'
      | 'nature_bien_cave'
      | 'nature_bien_cellier'
      | 'nature_bien_garage'
      | 'nature_bien_local'
      | 'nature_bien_parking'
      | 'nature_maison'
      | 'nature_mitoyen'
      | 'nature_immeuble'
      | 'nature_garage'
      | 'nature_bien_commercial'
      | 'nature_bien_autre';

    /**
     * Autre nature du bien.
     * Si nature_bien = nature_bien_autre.
     */
    nature_bien_autre?: string;

    /**
     * Présence d'un locataire. Indiquer 'oui' si le locataire est présent ou déjà parti
     */
    occupation_statut?: YesNo;

    /**
     * Le bien est (ou a été) loué.
     * Valeurs possibles :
     * - location_bail : Loué selon un contrat de bail
     * - occupation_gratuit : Occupé à titre gratuit
     */
    occupation_location?: 'location_bail' | 'occupation_gratuit';

    /**
     * Mesurage carrez obligatoire. Indiquer 'oui' si vous avez la superficie carrez du bien.
     */
    mesurage_carrez_statut?: YesNo;

    /**
     * Surface habitable en m2
     */
    surface_habitable?: number;

    /**
     * Superficie du lot en m².
     * Si mesurage_carrez_statut = oui.
     */
    mesurage_carrez_superficie?: number;

    /**
     * Date de construction.
     * Valeurs possibles :
     * - moins_10_ans: Il y a moins de 10 ans
     * - apres_1997: Après le 1er juillet 1997 (date du permis)
     * - 1949_1997: Après le 1er janvier 1949
     * - avant_1949: Avant 1949
     */
    construction?: 'moins_10_ans' | 'apres_1997' | '1949_1997' | 'avant_1949';

    /**
     * Détecteur de fumée
     */
    detecteur_fumee?: YesNo;

    /**
     * Piscine enterrée (et non hors-sol)
     */
    piscine?: YesNo;

    /**
     * Dispositif de sécurité
     * Valeurs possibles :
     * - alarme : Alarme
     * - rideau : Rideaux / Couvertures / Bâche à barres
     * - barriere : Une barrière
     * - abri : Un abri
     * - aucun_dispositif : Aucun dispositif
     * Si piscine = oui
     */
    piscine_securite?: 'alarme' | 'rideau' | 'barriere' | 'abri' | 'aucun_dispositif';

    /**
     * Présence de Cheminée / Poêle
     */
    cheminee?: YesNo;

    /**
     * Cheminée / Poêle fonctionnel
     */
    cheminee_fonctionnelle_statut?: YesNo;

    /**
     * Présence d'une chaudière
     */
    chaudiere_statut?: YesNo;

    /**
     * Type de chaudière.
     * Si chaudiere_statut = 'oui'.
     */
    chaudiere_statut_type?: 'gaz' | 'fioul' | 'autre';

    /**
     * Autre type de chaudière.
     * Si chaudiere_statut_type = autre.
     */
    chaudiere_statut_type_autre?: string;

    /**
     * Entretien chaudière effectué
     */
    chaudiere_entretien_statut?: YesNo;

    /**
     * Cuve à fioul
     */
    cuve_fioul_statut?: YesNo;

    /**
     * La cuve à fioul est
     * Valeurs possibles :
     * - operationnelle: Opérationnelle
     * - non_neutralisee: Non fonctionnelle et non neutralisée
     * - neutralisee: Non fonctionnelle et neutralisée
     */
    cuve_fioul_etat?: 'operationnelle' | 'non_neutralisee' | 'neutralisee';

    /**
     * Présence de servitudes
     */
    servitudes?: YesNo;

    /**
     * Liste des servitudes
     */
    servitudes_liste?: string;

    /**
     * Diagnostic plomb réalisé
     */
    diagnostic_plomb_statut?: YesNo;

    /**
     * Diagnostic amiante réalisé
     */
    diagnostic_amiante_statut?: YesNo;

    /**
     * Présence d'une installation de gaz
     */
    diagnostic_gaz_presence_installation?: YesNo;

    /**
     * Installation de gaz de plus de 15 ans
     */
    diagnostic_gaz_vielle_installation?: YesNo;

    /**
     * Diagnostic gaz réalisé
     */
    diagnostic_gaz_statut?: YesNo;

    /**
     * Présence d'une installation électrique
     */
    diagnostic_electrique_presence_installation?: YesNo;

    /**
     * Installation électrique de plus de 15 ans
     */
    diagnostic_electrique_vielle_installation?: YesNo;

    /**
     * Diagnostic électrique réalisé
     */
    diagnostic_electrique_statut?: YesNo;

    /**
     * Commune concernée par les termites
     */
    diagnostic_termites_commune?: YesNo;

    /**
     * Diagnostic termites réalisé
     */
    diagnostic_termites_statut?: YesNo;

    /**
     * Bien susceptible d'être concerné par la mérule
     */
    diagnostic_merule_commune?: YesNo;

    /**
     * Diagnostic mérule réalisé
     */
    diagnostic_merule_statut?: YesNo;

    /**
     * Diagnostic de performance Énergétique réalisé. En cas de DPE Vierge la réponse doit être non
     */
    dpe_details_statut?: YesNo;

    /**
     * Quotes-parts des parties communes générales. Exemple : 200/10000èmes
     */
    parties_communes_generales?: string;

    /**
     * Numéro d'identification fiscal du logement
     */
    numero_fiscal?: string;

    /**
     * Bien loué lors des 18 derniers mois
     */
    loue_anterieurement_moins_18_mois?: YesNo;

    /**
     * Montant du loyer payé par le dernier locataire en euros
     */
    loyer_dernier_montant?: number;

    /**
     * Date de versement du dernier loyer. Format : timestamp en millisecondes
     */
    loyer_derniere_date_paiement?: Timestamp;
  };
}

/**
 * Représente une fiche de contact à créer.
 * Les champs listés sont ceux les plus couramment utilisés par les outils externes et représentent un taux de complétion
 * évelé des différents mandats de vente ou location.
 * Pour une liste complète des champs disponibles, se référer à la documentation de l'API et l'endpoint GET /records/description
 * ou en complétant un contrat depuis la plateforme et en inspectant le network pour voir l'id du champ.
 */
export interface MyNotaryContact {
  type: 'RECORD__PERSONNE__PHYSIQUE' | 'RECORD__PERSONNE__MORALE';
  creatorId: number;
  organizationId: number;
  questions: {
    /**
     * Forme sociale.
     * Valeurs possibles :
     * - association : Association
     * - autre : Permet de renseigner n'importe quel valeur sous forme de texte dans personne_morale_forme_sociale_autre.
     * - commune: Commune - Mairie
     * - societe_sa : Société par Actions
     * - societe_sarl : Société à Responsabilité Limitée
     * - societe_sas : Société par Actions Simplifiée
     * - societe_sci : Société Civile Immobilière
     * Si type = RECORD__PERSONNE__MORALE
     */
    personne_morale_forme_sociale?:
      | 'association'
      | 'autre'
      | 'commune'
      | 'societe_sa'
      | 'societe_sarl'
      | 'societe_sas'
      | 'societe_sci';

    /**
     * Dénomination sociale.
     * Si type = RECORD__PERSONNE__MORALE
     */
    personne_morale_denomination?: string;

    /**
     * Capital social. Valeur en eurors.
     * Si type = RECORD__PERSONNE__MORALE
     */
    personne_morale_capital?: number;

    /**
     * Siren de la personne morale ou tout autre numéro d'identification si société basée à l'étranger.
     * Si type = RECORD__PERSONNE__MORALE
     */
    siren?: string;

    /**
     * Ville immatriculation
     */
    personne_morale_ville_rcs?: string;

    /**
     * Civilité
     */
    sexe?: 'femme' | 'homme';

    /**
     * Nom de naissance
     */
    nom?: string;

    /**
     * Prénom(s). Les prénoms composés doivent être séparés par un trait d'union
     */
    prenoms?: string;

    /**
     * Date de naissance. Format : timestamp en millisecondes
     */
    informations_personnelles_date_naissance?: Timestamp;

    /**
     * Ville de naissance
     */
    informations_personnelles_ville_naissance?: string;

    /**
     * Pays de naissance. Format : Code ISO 3166-1 alpha-2 (ex: FR pour France, BE pour Belgique, US pour États-Unis)
     */
    informations_personnelles_nationalite?: string;

    /**
     * Résidence fiscale en France
     */
    informations_personnelles_resident_fiscal?: YesNo;

    /**
     * Profession
     */
    informations_personnelles_profession?: string;

    /**
     * Email
     */
    email?: string;

    /**
     * Adresse du domicile ou Siège Social
     */
    adresse?: MyNotaryAddress;

    /**
     * Numéro de téléphone. Format : +33612345678
     */
    telephone?: string;
  };
}

export type RecordNew = MyNotaryHouse | MyNotaryContact;

interface Record {
  /**
   * Id de la fiche a conserver et à associer avec l'id de la fiche de l'outil métier pour éviter les doublons.
   */
  id: number;
  /**
   * Lien d'auto-connexion vers l'écran principal
   */
  link: string;
}

interface Contract {
  /**
   * Id du contrat
   */
  id: number;
  /**
   * Lien d'auto-connexion vers la page de rédaction du contrat
   */
  link: string;
}

interface Operation {
  /**
   * Id de l'opération a conserver et à associer avec l'id du bien de l'outil métier pour éviter les doublons et
   * conserver un trace des contrats en cours sur le bien.
   */
  id: number;
  /**
   * Id de l'organisation propriétaire du dossier
   */
  organizationId: number;
  /**
   * Type du dossier
   */
  type: string;
  /**
   * Lien d'auto-connexion vers l'écran principal
   */
  link: string;
}

/**
 * Représente une operation à créer.
 * Les champs listés sont ceux les plus couramment utilisés par les outils externes et représentent un taux de complétion
 * évelé des différents mandats de vente ou location.
 * Pour une liste complète des champs disponibles, se référer à la documentation de l'API et l'endpoint GET /operations/description
 * ou en complétant un contrat depuis la plateforme et en inspectant le network pour voir l'id du champ.
 */
export interface OperationNew {
  /**
   * Type d'opération.
   * Cette valeur doit être sélectionnée par l'utilisateur.
   * Les valeurs disponibles pour chaque organisations peuvent être récupérées grâce à l'endpoint
   * GET /organizations/operations
   */
  type: string;
  creatorId: number;
  organizationId: number;

  /**
   * Nom du dossier.
   * Si non renseigné, la nommenclature par defaut est utilisée
   */
  label?: string;
  questions: {
    /**************************************************
     * Informations générales sur le mandat           *
     * ************************************************/

    /**
     * Mandat complété en tout ou partie à la main après impression
     * Si 'oui' permet de remplir certaines parties du mandat avant de l'imprimer puis de compléter le reste à la main
     * lors de la signature.
     * Si 'non' le mandat est complété entièrement en ligne
     * Conseil: mettre à non par défaut
     */
    mandat_tapuscrit?: YesNo;

    /**
     * Type de mandat.
     * - exclusif: Mandat exclusif
     * - semi: Mandat semi-exclusif
     * - simple: Mandat simple
     * - gestion: Mandat de gestion locative
     */
    mandat_type?: 'exclusif' | 'semi' | 'simple' | 'gestion';

    /**
     * Numéro du mandat de location.
     */
    mandat_numero_transaction?: string;

    /**
     * Numéro de gestion du mandat.
     */
    mandat_numero_gestion?: string;

    /**
     * Numéro de mandat de transaction
     */
    mandat_numero?: string;

    /**
     * Conditions de la semi-exclusivité
     * Simandat_type est semi.
     * Valeurs possibles :
     * - mandat_semi_agence_unique : Aucun honoraires ne sont dus si le Bailleur trouve lui même un Locataire ou
     * que le Vendeur trouve lui même un Acquéreur
     * - mandat_semi_honoraire_reduits : Les honoraires sont réduits de moitié si le Bailleur trouve lui même un
     * Locataire ou que le Vendeur trouve lui même un Acquéreur
     */
    mandat_semi_conditions?: 'mandat_semi_agence_unique' | 'mandat_semi_honoraire_reduits';

    /**
     * Affichage des références cadastrales
     * Conseil : mettre à non par défaut
     */
    mandat_cadastre?: YesNo;

    /**
     * Honoraires de l'agence indiqués.
     * Valeurs possibles :
     * - recherche_pourcentage : En pourcentage
     * - recherche_fixe : En montant fixe
     */
    mandat_vente_calcul?: 'recherche_pourcentage' | 'recherche_fixe';

    /**
     * Honoraires d'agence à la charge.
     * Valeurs possibles :
     * - honoraires_charge_vendeur : Honoraires à la charge du Vendeur
     * - honoraires_charge_acquereur : Honoraires à la charge de l'Acquéreur
     * - honoraires_charge_double : Honoraires partagés entre le Vendeur et l'Acquéreur
     */
    mandat_honoraires_charge?: 'honoraires_charge_vendeur' | 'honoraires_charge_acquereur' | 'honoraires_charge_double';

    /**
     * Pourcentage total des honoraires.
     * Si mandat_vente_calcul = recherche_pourcentage.
     */
    mandat_pourcentage_honoraires_vente_total?: number;

    /**
     * Montant total des honoraires.
     * Si mandat_vente_calcul = recherche_fixe.
     */
    mandat_honoraires_montant?: number;

    /**
     * Pourcentage des honoraires charge Vendeur.
     * Si mandat_honoraires_charge = honoraires_charge_double et mandat_vente_calcul = recherche_pourcentage.
     */
    mandat_pourcentage_honoraires_vendeur?: number;

    /**
     * Pourcentage des honoraires charge Acquéreur.
     * Si mandat_honoraires_charge = honoraires_charge_double et mandat_vente_calcul = recherche_pourcentage.
     */
    mandat_pourcentage_honoraires_acquereur?: number;

    /**
     * Montant des honoraires charge Vendeur.
     * Si mandat_honoraires_charge = honoraires_charge_double et mandat_vente_calcul = recherche_fixe.
     */
    mandat_honoraires_charge_double_vendeur?: number;

    /**
     * Montant des honoraires charge Acquéreur.
     * Si mandat_honoraires_charge = honoraires_charge_double et mandat_vente_calcul = recherche_fixe.
     */
    mandat_honoraires_charge_double_acquereur?: number;

    /**
     * Durée du mandat en mois.
     */
    mandat_duree?: number;

    /**
     * Durée de la reconduction tacite du mandat en mois.
     */
    mandat_duree_recondution?: number;

    /**
     * Durée totale du mandat en mois.
     * Utilisé uniquement dans la location.
     */
    mandat_duree_recondution_totale?: number;

    /**
     * Le client agit dans le cadre de ses activités personnelles ou professionnelles.
     */
    mandant_statut?: 'personnelles' | 'professionnelles';

    /**
     * Fréquence de compte rendu des visites
     * Valeurs possibles :
     * - systematique : À chaque visite
     * - hebdomadaire : Chaque semaine
     * - frequence_autre : Autre
     */
    mandat_frequence?: 'systematique' | 'hebdomadaire' | 'frequence_autre';

    /**
     * Accord pour recommandé électronique
     * Conseil : mettre à oui par défaut
     */
    mandat_recommande_electronique?: YesNo;

    /**
     * Signature électronique.
     * Conseil : mettre à oui par défaut
     */
    mandat_signature_electronique?: YesNo;

    /**
     * Prix de vente. Meubles compris et hors honoraires acquéreur ; ne pas déduire les honoraires vendeur
     */
    prix_vente_total?: number;

    /**
     * Le montant des honoraires de location est indiqué
     * Valeurs possibles :
     * - modalite_mention_honoraires_location_fixes : Par des montants chiffrés
     * - modalite_mention_honoraires_location_autre : Par une autre répartition (en texte libre)
     * Utilisé uniquement dans la location.
     */
    mandat_honoraires_mention?:
      | 'modalite_mention_honoraires_location_fixes'
      | 'modalite_mention_honoraires_location_autre';

    /**
     * Montant des honoraires à la charge du Bailleur
     * Si mandat_honoraires_mention = modalite_mention_honoraires_location_autre
     * Utilisé uniquement dans la location.
     */
    honoraires_location_bailleur_autre?: string;

    /**
     * Montant des honoraires à la charge du Locataire
     * Si mandat_honoraires_mention = modalite_mention_honoraires_location_autre
     * Utilisé uniquement dans la location.
     */
    honoraires_location_locataire_autre?: string;

    /**
     * Précisez les modalités de comptes rendus
     * Si mandat_frequence = frequence_autre
     * Utilisé uniquement dans la location.
     */
    mandat_frequence_autre_detail?: string;

    /**
     * Etat des lieux établi par l'agence
     * Utilisé uniquement dans la location.
     */
    honoraires_etat_des_lieux_statut?: YesNo;

    /**
     * Bailleur: Honoraires d'entremise et de négociation
     * Si mandat_honoraires_mention = modalite_mention_honoraires_location_fixes
     * Utilisé uniquement dans la location.
     */
    honoraires_location_bailleur?: number;

    /**
     * Bailleur : Appliquer automatiquement le plafond légal pour les honoraires de visite, constitution de dossier,
     * rédaction du bail (8/10/12 € par m2 en fonction de la zone automatiquement détectée grace au code postal du bien)
     * Si mandat_honoraires_mention = modalite_mention_honoraires_location_fixes
     * Utilisé uniquement dans la location.
     */
    honoraires_prestation_redaction_bailleur_automatique?: YesNo;

    /**
     * Bailleur : Appliquer automatiquement le plafond légal pour les honoraires d'état des lieux (3€ par m2)
     * Utilisé uniquement dans la location.
     */
    honoraires_etat_des_lieux_bailleur_automatique?: YesNo;

    /**
     * Locataire : Appliquer automatiquement le plafond légal pour les honoraires de visite, constitution de dossier,
     * rédaction du bail (8/10/12 € par m2 en fonction de la zone automatiquement détectée grace au code postal du bien)
     * Utilisé uniquement dans la location.
     */
    honoraires_prestation_redaction_locataire_automatique?: YesNo;

    /**
     * Locataire : Appliquer automatiquement le plafond légal pour les honoraires d'état des lieux (3€ par m2)
     * Utilisé uniquement dans la location.
     */
    honoraires_prestation_etat_des_lieux_locataire_automatique?: YesNo;

    /**
     * Les frais sont-ils répartis entre le Bailleur et le futur Locataire ?
     * Utilisé uniquement dans la location professionnelle.
     */
    honoraires_prestation_repartition?: YesNo;

    /**
     * Des frais de rédaction d'acte sont-ils dûs à l'agence immobilière ?
     * Utilisé uniquement dans la location professionnelle.
     */
    honoraires_redaction_statut?: YesNo;

    /**
     * Montant des honoraires d'établissement de l'état des lieux à charge du Bailleur
     * Utilisé uniquement dans la location professionnelle.
     */
    honoraires_prestation_etat_des_lieux_bailleur?: number;

    /**
     * Montant des honoraires de location à la charge du Locataire
     * Utilisé uniquement dans la location professionnelle.
     */
    honoraires_location_locataire?: number;

    /**
     * Montant des honoraires d'établissement de l'état des lieux à charge du Locataire
     * Utilisé uniquement dans la location professionnelle.
     */
    honoraires_prestation_etat_des_lieux_locataire?: number;

    /**
     * Information sur le tracfin vendeur
     */

    /**
     * Rencontre physique avec le client
     */
    presence_client_vendeur?: YesNo;
    /**
     * Dans le cas d'une rencontre avec le vendeur, Type de pièce d'identité fournis
     * Valeurs possibles :
     * - cni : Carte d'idendité
     * - passeport : Passeport
     * - sejour : Titre de séjour
     */
    piece_identite_vendeur?: 'cni' | 'passeport' | 'sejour';

    /**
     * Il y a une incohérence entre l'âge du Vendeur et son statut
     */
    tracfin_age_vendeur_simple?: YesNo;
    /**
     * La vente porte sur un Bien de luxe ou de prestige
     */
    tracfin_luxe_vendeur_simple?: YesNo;
    /**
     * Observation à ajouter
     */
    tracfin_observation_vendeur?: YesNo;
    /**
     *   Il y a une incohérence entre les revenus et le train de vie du Vendeur
     */
    tracfin_prix_vendeur_simple?: YesNo;
    /**
     * Il y a une incohérence entre les revenus et le train de vie du Vendeur
     */
    tracfin_revenus_vendeur_simple?: YesNo;
    /**
     * Le Vendeur est une personne politiquement exposée (diplomate, haute fonction publique...)
     */
    tracfin_politique_vendeur_simple?: YesNo;
    /**
     * La profession du Vendeur se situe dans un secteur à risque
     */
    tracfin_profession_vendeur_simple?: YesNo;
    /**
     * Opération anormale ou inhabituelle
     */
    tracfin_operation_anormale_vendeur?: YesNo;
    /**
     * Le Bien est situé dans une zone à risque
     */
    tracfin_localisation_vendeur_simple?: YesNo;

  };
}

interface VenteRecord {
  VENDEUR?: number[];
  ACQUEREUR?: number[];
  BIEN_VENDU?: number[];
}

interface LocationRecord {
  BAILLEUR?: number[];
  LOCATAIRE?: number[];
  BIEN_LOUE?: number[];
  GARANT?: number[];
}

type OperationRecord = VenteRecord | LocationRecord;

/**
 * Un dossier peut contenir plusieurs offre d'achat ou plusieurs bon de visite. Chaque contrat a un offrant ou un
 * visiteur différent.
 * Pour gérer ce cas la, les fiches sont associées lors de la création du contrat.
 */
export type ContractRecord = {
  OFFRANT?: number[];
  VISITEUR?: number[];
};

export interface OperationType {
  /**
   * Identifiant du type de l'opération.
   * A utiliser pour créer une nouvelle opération.
   */
  id: string;

  /**
   * Nom de ce type d'opération.
   * A afficher dans l'interface utilisateur pour afficher les contrats associés a ce type d'opération.
   */
  label: string;
  contracts: {
    /**
     * Identifiant du modèle de contrat.
     * A utiliser pour créer un nouveau contrat.
     */
    modelId: string;

    /**
     * Nom de ce type de contrat.
     * A afficher dans l'interface utilisateur pour qu'il puisse choisir le type de contrat.
     */
    label: string;
  }[];
}

export const myNotaryApiClient = new MyNotaryApiClient({ apiKey: API_KEY });
