import { NextRequest } from 'next/server';
import { withAuth, AuthContext, getRouteParam } from '@/server/http/auth-guard';
import { createReviewSchema } from '@/validators';
import { ReviewService } from '@/server/services/review.service';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const POST = withAuth(
  async (req: NextRequest, ctx: AuthContext, routeContext: unknown) => {
    try {
      const id = await getRouteParam(routeContext, 'id', req);

      const body = await req.json();
      const validated = createReviewSchema.parse(body);

      const review = await ReviewService.createReview(ctx.user, id, validated);
      return apiSuccess(review, undefined, 201);
    } catch (error) {
      return handleRouteError(error);
    }
  }
);
