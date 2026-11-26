import { Router } from 'express';
import { RemoteBlockDeps } from './RemoteBlock.types';
import { createRemoteBlockHandler } from './RemoteBlock.handler';
import {
  RemoteBlockValidationError,
  RemoteBlockNotFoundError,
  RemoteBlockConflictError,
  RemoteBlockCommandFailedError,
} from './RemoteBlock.types';

export const createRemoteBlockRouter = (deps: RemoteBlockDeps): Router => {
  const router = Router();
  const handler = createRemoteBlockHandler(deps);

  router.post('/vehicles/:id/block', async (req, res, next) => {
    try {
      const result = await handler.block({ vehicleId: req.params.id });
      res.json(result);
    } catch (error) {
      if (error instanceof RemoteBlockValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error instanceof RemoteBlockNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof RemoteBlockConflictError) {
        res.status(409).json({ error: error.message });
        return;
      }
      if (error instanceof RemoteBlockCommandFailedError) {
        res.status(502).json({ error: error.message });
        return;
      }
      next(error);
    }
  });

  router.post('/vehicles/:id/unblock', async (req, res, next) => {
    try {
      const result = await handler.unblock({ vehicleId: req.params.id });
      res.json(result);
    } catch (error) {
      if (error instanceof RemoteBlockValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error instanceof RemoteBlockNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof RemoteBlockConflictError) {
        res.status(409).json({ error: error.message });
        return;
      }
      if (error instanceof RemoteBlockCommandFailedError) {
        res.status(502).json({ error: error.message });
        return;
      }
      next(error);
    }
  });

  return router;
};
