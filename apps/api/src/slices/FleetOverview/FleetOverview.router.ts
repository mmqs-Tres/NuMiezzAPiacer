import { Router } from 'express';
import { FleetOverviewDeps } from './FleetOverview.types';
import { createFleetOverviewHandler } from './FleetOverview.handler';

export const createFleetOverviewRouter = (deps: FleetOverviewDeps): Router => {
  const router = Router();
  const handler = createFleetOverviewHandler(deps);

  router.get('/fleet', async (_req, res, next) => {
    try {
      const result = await handler({});
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
