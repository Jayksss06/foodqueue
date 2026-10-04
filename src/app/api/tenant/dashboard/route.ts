import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { AnalyticsService } from '@/server/services/analytics.service';
import { apiSuccess, apiForbidden } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const GET = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      if (!ctx.user.tenantId) {
        return apiForbidden('Akun Anda tidak terhubung ke profil toko tenant.');
      }

      const { searchParams } = new URL(req.url);
      const date = searchParams.get('date') || undefined;

      const dashboard = await AnalyticsService.getTenantDashboard(ctx.user.tenantId, date);
      return apiSuccess(dashboard);
    } catch (error) {
      return handleRouteError(error);
    }
  },
  { roles: ['TENANT'] }
);
