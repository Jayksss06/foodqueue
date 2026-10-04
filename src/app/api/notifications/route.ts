import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { NotificationService } from '@/server/services/notification.service';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const GET = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const result = await NotificationService.getUserNotifications(
      ctx.user.id,
      unreadOnly,
      page,
      pageSize
    );

    return apiSuccess(result.items, result.meta);
  } catch (error) {
    return handleRouteError(error);
  }
});

export const PATCH = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await NotificationService.markAllAsRead(ctx.user.id);
    return apiSuccess({ message: 'Semua notifikasi telah ditandai sebagai dibaca.' });
  } catch (error) {
    return handleRouteError(error);
  }
});
