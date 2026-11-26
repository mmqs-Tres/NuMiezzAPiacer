import { Router } from 'express';
import { WorkZonesDeps, WorkZonesValidationError } from './WorkZones.types';
import { createWorkZonesHandler } from './WorkZones.handler';

export const createWorkZonesRouter = (deps: WorkZonesDeps): Router => {
  const router = Router();
  const handler = createWorkZonesHandler(deps);

  // GET /work-zones — lista tutti i geofence cantiere
  router.get('/work-zones', async (_req, res, next) => {
    try {
      const zones = await handler.list();
      res.json(zones);
    } catch (error) {
      next(error);
    }
  });

  // POST /work-zones — crea un nuovo geofence cantiere
  router.post('/work-zones', async (req, res, next) => {
    try {
      const zone = await handler.create(req.body);
      res.status(201).json(zone);
    } catch (error) {
      if (error instanceof WorkZonesValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  });

  return router;
};
