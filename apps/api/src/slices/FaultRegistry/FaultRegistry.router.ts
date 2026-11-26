import { Router } from 'express';
import { FaultRegistryDeps } from './FaultRegistry.types';
import { createFaultRegistryHandler } from './FaultRegistry.handler';

export const createFaultRegistryRouter = (deps: FaultRegistryDeps): Router => {
  const router = Router();
  const handler = createFaultRegistryHandler(deps);

  router.get('/fault-reports', async (_req, res, next) => {
    try {
      const result = await handler({});
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
