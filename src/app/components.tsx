import { Alert, CircularProgress, Snackbar, Stack, Typography } from '@mui/material';
import { House } from './database.client';
import {
  createBienBody,
  createContractBody,
  createDossierBody,
  createOffrantBody,
  createOperationRecordBody,
  createVendeurBody,
  createVisiteurBody
} from './data-utils';
import { ContractRecord, ContractSpecificQuestions } from './mynotary.client';

export type Status = 'idle' | 'loading' | 'completed' | 'error';

export function CreationSnackBar({ status, onClose }: { status: Status; onClose: () => void }) {
  return (
    <>
      <Snackbar open={status === 'loading'}>
        <Alert
          icon={<CircularProgress color='inherit' size={20} sx={{ mr: 2 }} />}
          severity='info'
          variant='filled'
          sx={{ width: '100%' }}
        >
          Création du contrat en cours...
        </Alert>
      </Snackbar>
      <Snackbar open={status === 'completed'} autoHideDuration={6000} onClose={onClose}>
        <Alert severity='success' variant='filled' sx={{ width: '100%' }}>
          Création du contrat terminée !
        </Alert>
      </Snackbar>
      <Snackbar open={status === 'error'} autoHideDuration={12000} onClose={onClose}>
        <Alert severity='error' variant='filled' sx={{ width: '100%' }}>
          Erreur lors de la création du contrat
        </Alert>
      </Snackbar>
    </>
  );
}

export interface SpecfiqueContractInfo {
  questions: ContractSpecificQuestions;
  records?: ContractRecord;
}

export type OperationCreationCtx = {
  operationId: number;
  operationType: string;
  contractId: number;
  contractType: string;
  vendeurId: number;
  houseId: number;
  selectedHouse: House;
  specifiqueContractInfo: SpecfiqueContractInfo | null;
};

export function CodeInfo({ operationCreationCtx }: { operationCreationCtx: OperationCreationCtx }) {
  const { selectedHouse, operationId, operationType, contractType, houseId, vendeurId, specifiqueContractInfo } =
    operationCreationCtx;

  const hasVisiteur = (specifiqueContractInfo?.records?.VISITEUR?.length ?? 0) > 0;
  const hasOffrant = (specifiqueContractInfo?.records?.OFFRANT?.length ?? 0) > 0;

  return (
    <Stack spacing={2} m={4}>
      <CodeBlock title={'Body pour créer le vendeur'} code={createVendeurBody()} />
      {hasVisiteur && <CodeBlock title={'Body pour créer le visiteur'} code={createVisiteurBody()} />}
      {hasOffrant && <CodeBlock title={"Body pour créer l'offrant"} code={createOffrantBody()} />}
      <CodeBlock title={'Body pour créer le bien'} code={createBienBody(selectedHouse)} />
      <CodeBlock title={'Body pour créer le dossier'} code={createDossierBody(operationType)} />
      <CodeBlock
        title={'Body pour associer les fiches précédemment créées au dossier'}
        code={createOperationRecordBody(operationId, houseId, vendeurId)}
      />
      <CodeBlock
        title={'Body pour créer le contrat dans le dossier'}
        code={createContractBody(operationId, contractType, specifiqueContractInfo)}
      />
    </Stack>
  );
}

function CodeBlock({ title, code }: { title: string; code: object }) {
  return (
    <div>
      <Typography variant='h6'>{title}</Typography>
      <pre
        style={{
          backgroundColor: '#282c34',
          color: '#abb2bf',
          padding: '10px',
          borderRadius: '5px',
          overflowX: 'auto',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap'
        }}
      >
        <code>{JSON.stringify(code, null, 2)}</code>
      </pre>
    </div>
  );
}
