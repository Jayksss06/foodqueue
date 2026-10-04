import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { AnalyticsService } from '@/server/services/analytics.service';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const GET = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      const impactData = await AnalyticsService.getSDGImpactMetrics();
      return apiSuccess(impactData);
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['ADMIN'] }
);
