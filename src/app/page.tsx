'use client';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Card,
  Grid2,
  IconButton,
  List,
  ListItemButton,
  Dialog,
  ListItemText,
  Collapse,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import React, { useEffect } from 'react';
import { MyNotaryApiClient, OperationType } from '@/app/mynotary.client';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { DatabaseClient, House } from '@/app/database.client';

/**
 * ORGANIZATION_ID : Identifiant de l'organisation sur MyNotary. Il vous sera fourni par l'équipe MyNotary.
 * 5204 est l'identifiant de l'organisation de test sur l'envrionnement de pré-production.
 */
const ORGANIZATION_ID = 5204;
/**
 * API_KEY : Clé d'API pour accéder à l'API MyNotary. Elle vous sera fournie par l'équipe MyNotary.
 * f8634dda-ae9e-438d-a535-e4214b0a8926 est la clé d'API de l'application de test sur l'environnement de pré-production.
 * Cette application n'est autorisée qu'à effectuer des appels sur l'organisation de test 5204.
 */
const API_KEY = 'f8634dda-ae9e-438d-a535-e4214b0a8926';

/**
 * USER_ID : Identifiant de l'utilisateur sur MyNotary.
 * 54298 est l'identifiant de l'utilisateur de test sur l'environnement de pré-production.
 * Cet utilisateur est membre de l'organisation de test 5204.
 * info : John DOE - test+10001@mynotary.fr
 */
const USER_ID = 54298;

const myNotaryApiClient = new MyNotaryApiClient({ apiKey: API_KEY });
const storageClient = new DatabaseClient();

interface SelectedContract {
  operationTypeId: string;
  contractModelId: string;
  contractModelLabel: string;
}

export default function Home() {
  const [selectedHouse, setSelectedHouse] = React.useState<House | null>(null);
  const [creatingStatus, setCreatingStatus] = React.useState<'idle' | 'loading' | 'completed' | 'error'>('idle');
  const houses = storageClient.getHouses();

  useEffect(() => {
    storageClient.loadAssociations();
  }, []);

  /**
   * Crée un contrat à partir d'un bien sélectionné.
   * Le type de dossier et de contrat est récupéré depuis l'API MyNotary et sélectionné par l'utilisateur.
   * Le processus de création du contrat est le suivant :
   * 1. Création des fiches : Une fiche bien et un contact vendeur sont créés s'ils n'existent pas déjà sur MyNotary
   * 2. Création d'une opération : Un dossier est créé sur MyNotary et une association est faite entre le bien de
   * l'outil métier et ce dossier. Cette association permet de retrouver facilement le dossier en cours depuis l'outil métier.
   * 3. Association des fiches à l'opération : Le bien et le contact vendeur sont associés à l'opération
   * 4. Création du contrat : Un contrat de type sélectionné par l'utilisateur est créé
   * 5. Ouverture de l'interface MyNotary : L'utilisateur est redirigé vers l'interface MyNotary pour finaliser le contrat
   */
  const handleContractCreation = async (args: SelectedContract) => {
    if (selectedHouse == null) {
      throw new Error('No house selected');
    }

    setCreatingStatus('loading');
    setSelectedHouse(null);

    try {
      let houseRecordId = storageClient.findMynotaryRecordId(selectedHouse.id);

      if (houseRecordId == null) {
        const house = await myNotaryApiClient.postRecord({
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
        });
        houseRecordId = house.id;
        storageClient.addAssociation({ type: 'RECORD', externalId: selectedHouse.id, myNotaryId: house.id });
      }

      let contactRecordId = storageClient.findMynotaryRecordId('external_app_vendeur_1');

      if (contactRecordId == null) {
        const vendeur = await myNotaryApiClient.postRecord({
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
        });
        storageClient.addAssociation({ type: 'RECORD', externalId: 'external_app_vendeur_1', myNotaryId: vendeur.id });
        contactRecordId = vendeur.id;
      }

      /**
       * Inutile de conditionner le mapping des champs en fonction du type de dossier car les champs non utilisées
       * seront automatiquement ignorées.
       */
      const operation = await myNotaryApiClient.postOperation({
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
          prix_vente_total: selectedHouse.price
        }
      });
      storageClient.addAssociation({ type: 'OPERATION', externalId: selectedHouse.id, myNotaryId: operation.id });

      if (
        args.operationTypeId == 'OPERATION__IMMOBILIER__VENTE_ANCIEN' ||
        args.operationTypeId == 'OPERATION__IMMOBILIER__VENTE_VIAGER' ||
        args.operationTypeId == 'OPERATION__IMMOBILIER__VENTE_BIEN_PROFESSIONNEL'
      ) {
        await myNotaryApiClient.postOperationRecords({
          operationId: operation.id,
          operationRecords: {
            BIEN_VENDU: [houseRecordId],
            VENDEUR: [contactRecordId]
          }
        });
      } else if (
        args.operationTypeId == 'OPERATION__IMMOBILIER__LOCATION' ||
        args.operationTypeId == 'OPERATION__IMMOBILIER__LOCATION_COMMERCIAL'
      ) {
        await myNotaryApiClient.postOperationRecords({
          operationId: operation.id,
          operationRecords: {
            BIEN_LOUE: [houseRecordId],
            BAILLEUR: [contactRecordId]
          }
        });
      }

      const contract = await myNotaryApiClient.postContract({
        userId: USER_ID,
        operationId: operation.id,
        type: args.contractModelId,
        label: args.contractModelId
      });

      window.open(contract.link, '_blank')?.focus();

      setCreatingStatus('completed');
    } catch (e) {
      console.error(e);
      setCreatingStatus('error');
    }
  };

  const handleOperationAccess = async (house: House) => {
    const myNotaryOperationId = storageClient.findMynotaryOperationId(house.id);
    if (myNotaryOperationId == null) {
      throw new Error('No operation found for this house');
    }
    const login = await myNotaryApiClient.getLogin({ userId: USER_ID, operationId: myNotaryOperationId });
    window.open(login.link, '_blank')?.focus();
  };

  return (
    <>
      <Box>
        <AppBar color='primary' position='static'>
          <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant='h5'>MyNotary Public Api Demo</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                color='error'
                onClick={() => storageClient.clearAssociations()}
                sx={{ ml: 'auto', color: 'white' }}
                variant='contained'
              >
                Supprimer les associations
              </Button>
            </Box>
          </Toolbar>
        </AppBar>
      </Box>

      <Grid2 container spacing={2} sx={{ m: 4 }}>
        {houses.map((house) => {
          const operationId = storageClient.findMynotaryOperationId(house.id);
          return (
            <Card key={house.id} raised={true} sx={{ p: 2, m: 2 }}>
              <Typography variant='h6'>{`${house.address.street} ${house.address.zipCode} ${house.address.city}`}</Typography>
              <Typography variant='body2'>Prix : {house.price} €</Typography>
              <Typography variant='body2'>Surface : {house.surface} m²</Typography>
              {operationId != null && <Button onClick={() => handleOperationAccess(house)}>Accéder au dossier</Button>}
              {operationId == null && <Button onClick={() => setSelectedHouse(house)}>Créer un contrat</Button>}
            </Card>
          );
        })}
      </Grid2>

      <ContractSelectionDialog
        open={selectedHouse != null}
        onClose={() => setSelectedHouse(null)}
        onContractSelection={handleContractCreation}
      />

      <Snackbar open={creatingStatus === 'loading'}>
        <Alert
          icon={<CircularProgress color='inherit' size={20} sx={{ mr: 2 }} />}
          severity='info'
          variant='filled'
          sx={{ width: '100%' }}
        >
          Création du contrat en cours...
        </Alert>
      </Snackbar>

      <Snackbar open={creatingStatus === 'completed'} autoHideDuration={6000} onClose={() => setCreatingStatus('idle')}>
        <Alert severity='success' variant='filled' sx={{ width: '100%' }}>
          Création du contrat terminée !
        </Alert>
      </Snackbar>

      <Snackbar open={creatingStatus === 'error'} autoHideDuration={12000} onClose={() => setCreatingStatus('idle')}>
        <Alert severity='error' variant='filled' sx={{ width: '100%' }}>
          Erreur lors de la création du contrat
        </Alert>
      </Snackbar>
    </>
  );
}

const ContractSelectionDialog = (props: {
  open: boolean;
  onClose: () => void;
  onContractSelection: (args: SelectedContract) => void;
}) => {
  const [operationTypes, setOperationTypes] = React.useState<OperationType[]>([]);
  const [loadingStatus, setLoadingStatus] = React.useState<'idle' | 'loading' | 'completed' | 'error'>('idle');

  useEffect(() => {
    if (props.open && loadingStatus === 'idle') {
      myNotaryApiClient
        .getOperationTypes({ organizationId: ORGANIZATION_ID })
        .then(setOperationTypes)
        .catch(() => setLoadingStatus('error'))
        .finally(() => setLoadingStatus('completed'));
    }
  }, [loadingStatus, props.open]);

  return (
    <Dialog fullScreen open={props.open} onClose={props.onClose}>
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton edge='start' color='inherit' onClick={props.onClose} aria-label='close'>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      {loadingStatus === 'loading' && <Typography>Chargement en cours...</Typography>}
      {loadingStatus === 'error' && <Typography>Erreur lors du chargement des contrats</Typography>}
      {loadingStatus === 'completed' && (
        <ContractList organizationOperations={operationTypes} onContractSelection={props.onContractSelection} />
      )}
    </Dialog>
  );
};

/**
 * Liste les types de dossiers et les contrats associés à chaque type de dossier
 */
const ContractList = (props: {
  organizationOperations: OperationType[];
  onContractSelection: (args: SelectedContract) => void;
}) => {
  const [selectedOperationTypeId, setSelectedOperationTypeId] = React.useState<string | null>(null);
  const [selectedContract, setSelectedContract] = React.useState<{ modelId: string; label: string } | null>(null);

  const handleOperationClick = (operationTypeId: string) => {
    if (selectedOperationTypeId === operationTypeId) {
      setSelectedOperationTypeId(null);
    } else {
      setSelectedOperationTypeId(operationTypeId);
    }
  };

  const handleContractSelection = () => {
    if (selectedOperationTypeId == null) {
      throw new Error('No operation type selected');
    }

    if (selectedContract == null) {
      throw new Error('No contract selected');
    }

    props.onContractSelection({
      operationTypeId: selectedOperationTypeId,
      contractModelId: selectedContract.modelId,
      contractModelLabel: selectedContract.label
    });
  };

  return (
    <Box>
      <Typography variant='h5' sx={{ p: 2, m: 2, textAlign: 'center' }}>
        Sélectionnez le type de dossier et le type de contrat
      </Typography>
      <List sx={{ width: '100%', maxWidth: 800, m: 'auto' }}>
        {props.organizationOperations.map((operation) => {
          const isOperationTypeSelected = selectedOperationTypeId === operation.id;
          return (
            <React.Fragment key={operation.id}>
              <ListItemButton selected={isOperationTypeSelected} onClick={() => handleOperationClick(operation.id)}>
                <>
                  <ListItemText primary={operation.label} />
                  {isOperationTypeSelected ? <ExpandLess /> : <ExpandMore />}
                </>
              </ListItemButton>
              <Collapse in={isOperationTypeSelected} timeout='auto' unmountOnExit>
                <List component='div' disablePadding sx={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}>
                  {operation.contracts.map((contract) => (
                    <ListItemButton key={contract.modelId} sx={{ pl: 4 }} onClick={() => setSelectedContract(contract)}>
                      <ListItemText primary={contract.label} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          );
        })}
      </List>

      <Dialog open={selectedContract !== null} onClose={() => setSelectedContract(null)}>
        <DialogTitle>{`Créer un "${selectedContract?.label}" ?`}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`Êtes-vous sûr de vouloir créer un contrat de type "${selectedContract?.label}" ? Les données du bien et des
            contacts seront récupérées et vous allez être redirigé vers l'interface de MyNotary.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedContract(null)}>Annuler</Button>
          <Button onClick={handleContractSelection} autoFocus>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
