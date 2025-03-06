import { Alert, CircularProgress, Snackbar } from '@mui/material';

export type Status = 'idle' | 'loading' | 'completed' | 'error';

export function Snackbars({ status, onClose }: { status: Status; onClose: () => void }) {
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
