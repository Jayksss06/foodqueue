import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { NotificationService } from '@/server/services/notification.service';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const PATCH = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      const url = new URL(req.url);
      const segments = url.pathname.split('/');
      // /api/notifications/[id]/read -> id is segments[length - 2]
      const id = segments[segments.length - 2];

      await NotificationService.markAsRead(ctx.user.id, id);
      return apiSuccess({ message: 'Notifikasi ditandai sebagai dibaca.' });
    } catch (error) {
      return handleRouteError(error);
    }
  }
);
