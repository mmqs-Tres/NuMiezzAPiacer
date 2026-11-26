import { Router } from 'express';
import { RideAnalyticsDeps } from './RideAnalytics.types';
import { createRideAnalyticsHandler } from './RideAnalytics.handler';
import { RideAnalyticsValidationError } from './RideAnalytics.types';

export const createRideAnalyticsRouter = (deps: RideAnalyticsDeps): Router => {
  const router = Router();
  const handler = createRideAnalyticsHandler(deps);

  router.get('/analytics/rides', async (req, res, next) => {
    try {
      const { from, to } = req.query;
      const result = await handler({
        from: typeof from === 'string' ? from : undefined,
        to: typeof to === 'string' ? to : undefined,
      });
      res.json(result);
    } catch (error) {
      if (error instanceof RideAnalyticsValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  });

  return router;
};
