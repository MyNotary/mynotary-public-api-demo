import { myNotaryApiClient, OperationType } from '@/app/data/mynotary.client';
import React, { useEffect } from 'react';
import { ORGANIZATION_ID } from '@/app/config';
import {
  AppBar,
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { SelectedContract } from '@/app/page';


/**
 * Dialog permettant de sélectionner un type de dossier et un type de contrat.
 * Les types de dossiers et les contrats associés sont récupérés depuis l'API MyNotary et peuvent être différent en
 * fonction des clients
 */
export const ContractListDialog = (props: {
  open: boolean;
  onClose: () => void;
  onContractSelection: (args: SelectedContract) => void;
  filteringStrategy?: (operationtype: OperationType[]) => OperationType[];
}) => {
  const [operationTypes, setOperationTypes] = React.useState<OperationType[]>([]);
  const [loadingStatus, setLoadingStatus] = React.useState<'idle' | 'loading' | 'completed' | 'error'>('idle');

  useEffect(() => {
    if (props.open && loadingStatus === 'idle') {
      setLoadingStatus('loading');
      myNotaryApiClient
        .getOperationTypes({ organizationId: ORGANIZATION_ID })
        .then(setOperationTypes)
        .catch(() => setLoadingStatus('error'))
        .finally(() => setLoadingStatus('completed'));
    }
  }, [loadingStatus, props.open]);

  const operationTypesFiltered = props.filteringStrategy ? props.filteringStrategy(operationTypes) : operationTypes;

  return (
    <Dialog fullScreen open={props.open} onClose={props.onClose}>
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={props.onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      {loadingStatus === 'loading' && <Typography>Chargement en cours...</Typography>}
      {loadingStatus === 'error' && <Typography>Erreur lors du chargement des contrats</Typography>}
      {loadingStatus === 'completed' && (
        <ContractList organizationOperations={operationTypesFiltered} onContractSelection={props.onContractSelection} />
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
      <Typography variant="h5" sx={{ p: 2, m: 2, textAlign: 'center' }}>
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
              <Collapse in={isOperationTypeSelected} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}>
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