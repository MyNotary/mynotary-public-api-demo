'use client';
import { AppBar, Box, Button, Card, Grid2, Toolbar, Typography } from '@mui/material';
import React, { useEffect } from 'react';
import { myNotaryApiClient } from '@/app/data/mynotary.client';
import { databaseClient, House } from '@/app/data/database.client';
import { Snackbars, Status } from './components/snackbars';
import { USER_ID } from '@/app/config';
import { ContractListDialog } from '@/app/components/contract-list-dialog';
import {
  createBienBody,
  createContractBody,
  createOperationBody,
  createPersonnePhysiqueBody,
  findOrCreateRecord
} from '@/app/data/data-mapping-utils';

export interface SelectedContract {
  operationTypeId: string;
  contractModelId: string;
  contractModelLabel: string;
}

export default function CreateBasicOperationExample() {
  const [selectedHouse, setSelectedHouse] = React.useState<House | null>(null);
  const [creatingStatus, setCreatingStatus] = React.useState<Status>('idle');
  const houses = databaseClient.getHouses();

  useEffect(() => {
    databaseClient.loadAssociations();
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
      const houseRecordId = await findOrCreateRecord({
        body: createBienBody(selectedHouse),
        externalId: selectedHouse.id
      });
      const contactRecordId = await findOrCreateRecord({
        body: createPersonnePhysiqueBody({
          email: 'jean-dupont@gmail.com',
          nom: 'DUPONT',
          prenoms: 'Jean'
        }),
        externalId: 'jean-dupont@gmail.com'
      });

      /**
       * Il est important de noter qu'il n'est pas nécessaire de conditionner le mapping des champs en fonction du
       * type de dossier ou de contract car les champs non utilisées seront automatiquement ignorées, la condition
       * est la à titre d'exemple.
       */
      const operation = await myNotaryApiClient.postOperation(
        createOperationBody({
          selectedHouse,
          operationTypeId: args.operationTypeId
        })
      );
      databaseClient.addAssociation({ type: 'OPERATION', externalId: selectedHouse.id, myNotaryId: operation.id });

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

      const contractBody = await createContractBody({
        operationId: operation.id,
        contractModelId: args.contractModelId,
        contractLabel: args.contractModelLabel
      });
      const contract = await myNotaryApiClient.postContract(contractBody);

      window.open(contract.link, '_blank')?.focus();

      setCreatingStatus('completed');
    } catch (e) {
      console.error(e);
      setCreatingStatus('error');
    }
  };

  const handleOperationAccess = async (house: House) => {
    const myNotaryOperationId = databaseClient.findMynotaryOperationId(house.id);
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
                onClick={() => databaseClient.clearAssociations()}
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
          const operationId = databaseClient.findMynotaryOperationId(house.id);
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

      <ContractListDialog
        open={selectedHouse != null}
        onClose={() => setSelectedHouse(null)}
        onContractSelection={handleContractCreation}
      />
      <Snackbars status={creatingStatus} onClose={() => setCreatingStatus('idle')} />
    </>
  );
}
