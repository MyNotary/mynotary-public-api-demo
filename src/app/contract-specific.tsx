import { Button, Card, Grid2, Typography } from '@mui/material';
import {
  ContractSelectionDialog,
  myNotaryApiClient,
  ORGANIZATION_ID,
  SelectedContract,
  storageClient,
  USER_ID
} from './page';
import React from 'react';
import { ContractRecord, ContractSpecificQuestions, OperationType } from './mynotary.client';
import { CodeInfo, CreationSnackBar, OperationCreationCtx, SpecfiqueContractInfo, Status } from './components';
import {
  createBienBody,
  createContractBody,
  createDossierBody,
  createOffrantBody,
  createOperationRecordBody,
  createVendeurBody,
  createVisiteurBody
} from './data-utils';

export const ContractSpecificExample = () => {
  const houses = storageClient.getHouses();

  const [creatingStatus, setCreatingStatus] = React.useState<Status>('idle');
  const [selectedHouseId, setSelectedHouseId] = React.useState<string | null>(null);
  const [openDialog, setOpenDialog] = React.useState(false);

  const [operationCreationCtx, setOperationCreationCtx] = React.useState<OperationCreationCtx | null>(null);

  const handleOperationAccess = async (houseId: string) => {
    const myNotaryOperationId = storageClient.findMynotaryOperationId(houseId);
    if (myNotaryOperationId == null) {
      throw new Error('No operation found for this house');
    }
    const login = await myNotaryApiClient.getLogin({ userId: USER_ID, operationId: myNotaryOperationId });
    window.open(login.link, '_blank')?.focus();
  };

  const handleContractCreation = async (args: SelectedContract) => {
    if (selectedHouseId == null) {
      throw new Error('No house selected');
    }

    const selectedHouse = houses.find((house) => house.id === selectedHouseId);

    setCreatingStatus('loading');
    setSelectedHouseId(null);
    setOpenDialog(false);

    try {
      let houseRecordId = storageClient.findMynotaryRecordId(selectedHouseId);

      if (selectedHouse == null) {
        return;
      }

      if (houseRecordId == null) {
        const house = await myNotaryApiClient.postRecord(createBienBody(selectedHouse));
        houseRecordId = house.id;
        storageClient.addAssociation({ type: 'RECORD', externalId: selectedHouse.id, myNotaryId: house.id });
      }

      let contactRecordId = storageClient.findMynotaryRecordId('external_app_vendeur_1');

      if (contactRecordId == null) {
        const vendeur = await myNotaryApiClient.postRecord(createVendeurBody());
        storageClient.addAssociation({
          type: 'RECORD',
          externalId: 'external_app_vendeur_1',
          myNotaryId: vendeur.id
        });
        contactRecordId = vendeur.id;
      }

      /**
       * Inutile de conditionner le mapping des champs en fonction du type de dossier car les champs non utilisées
       * seront automatiquement ignorées.
       */
      const operation = await myNotaryApiClient.postOperation(createDossierBody(args.operationTypeId));
      storageClient.addAssociation({ type: 'OPERATION', externalId: selectedHouse.id, myNotaryId: operation.id });

      await myNotaryApiClient.postOperationRecords(
        createOperationRecordBody(operation.id, houseRecordId, contactRecordId)
      );

      const contractInfos = await createContractSpecificInformation(args);

      const contract = await myNotaryApiClient.postContract(
        createContractBody(operation.id, args.contractModelId, contractInfos)
      );

      window.open(contract.link, '_blank')?.focus();

      setCreatingStatus('completed');
      setOperationCreationCtx({
        operationId: operation.id,
        operationType: args.operationTypeId,
        contractId: contract.id,
        contractType: args.contractModelId,
        vendeurId: contactRecordId,
        houseId: houseRecordId,
        selectedHouse: selectedHouse,
        specifiqueContractInfo: contractInfos
      });
    } catch (e) {
      console.error(e);
      setCreatingStatus('error');
    }
  };

  const handleClickCreate = (houseId: string) => {
    setSelectedHouseId(houseId);
    setOpenDialog(true);
  };

  return (
    <div>
      <h1>Exemple de création avec des informations spécifique à un contrat </h1>
      <p>
        Dans certains cas, comme un contrat de type "offre d'achat" ou 'bon de visite', nous devons créer des
        informations et des fiches spécifiques à ce contrat.
      </p>
      <Grid2 container spacing={2} sx={{ m: 4 }}>
        {houses.map((house) => {
          const operationId = storageClient.findMynotaryOperationId(house.id);
          return (
            <Card key={house.id} raised={true} sx={{ p: 2, m: 2 }}>
              <Typography variant='h6'>{`${house.address.street} ${house.address.zipCode} ${house.address.city}`}</Typography>
              <Typography variant='body2'>Prix : {house.price} €</Typography>
              <Typography variant='body2'>Surface : {house.surface} m²</Typography>
              {operationId != null && (
                <Button onClick={() => handleOperationAccess(house.id)}>Accéder au dossier</Button>
              )}
              {operationId == null && <Button onClick={() => handleClickCreate(house.id)}>Créer un contrat</Button>}
            </Card>
          );
        })}
      </Grid2>
      {operationCreationCtx && <CodeInfo operationCreationCtx={operationCreationCtx} />}
      <ContractSelectionDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onContractSelection={handleContractCreation}
        filteringStrategy={filteringStrategy}
      />
      <CreationSnackBar status={creatingStatus} onClose={() => setCreatingStatus('idle')} />
    </div>
  );
};

async function createContractSpecificInformation(args: SelectedContract): Promise<SpecfiqueContractInfo | null> {
  // Ajouter des informations spécifiques au bon de visite
  if (args.contractModelId === 'IMMOBILIER_VENTE_ANCIEN_BON_VISITE') {
    let visiteurId = storageClient.findMynotaryRecordId('external_app_visiteur_1');
    if (visiteurId == null) {
      const visiteur = await myNotaryApiClient.postRecord(createVisiteurBody());
      visiteurId = visiteur.id;
      storageClient.addAssociation({
        type: 'RECORD',
        externalId: 'external_app_visiteur_1',
        myNotaryId: visiteur.id
      });
    }

    return {
      questions: {
        date_visite: new Date().getTime(),
        visite_electronique: 'oui'
      },
      records: {
        VISITEUR: [visiteurId]
      }
    };
  }

  // Ajouter des informations spécifiques à l'offre d'achat
  if (args.contractModelId === 'IMMOBILIER_VENTE_ANCIEN_OFFRE_ACHAT') {
    let offrantId = storageClient.findMynotaryRecordId('external_app_offrant_1');
    if (offrantId == null) {
      const offrant = await myNotaryApiClient.postRecord(createOffrantBody());
      offrantId = offrant.id;
      storageClient.addAssociation({
        type: 'RECORD',
        externalId: 'external_app_offrant_1',
        myNotaryId: offrant.id
      });
    }

    return {
      questions: {
        offre_developpee: 'oui',
        offre_prix: 100000,
        offre_apport: 'oui',
        offre_apport_total: 50000,
        offre_emprunt: 'oui',
        offre_emprunt_total: 50000,
        offre_date_validite: new Date().getTime(),
        offre_date_extreme_signature: new Date().getTime()
      },
      records: {
        OFFRANT: [offrantId]
      }
    };
  }

  return null;
}

function includeContract(contract: { modelId: string; label: string }) {
  return ['IMMOBILIER_VENTE_ANCIEN_OFFRE_ACHAT', 'IMMOBILIER_VENTE_ANCIEN_BON_VISITE'].includes(contract.modelId);
}

function filteringStrategy(operationtype: OperationType[]) {
  return operationtype
    .filter((operation) => operation.id === 'OPERATION__IMMOBILIER__VENTE_ANCIEN')
    .map((operation) => ({ ...operation, contracts: operation.contracts.filter(includeContract) }));
}
