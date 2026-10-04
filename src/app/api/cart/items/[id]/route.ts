import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { updateCartItemSchema } from '@/validators';
import { CartService } from '@/server/services/cart.service';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const PATCH = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      const url = new URL(req.url);
      const segments = url.pathname.split('/');
      const id = segments[segments.length - 1];

      const body = await req.json();
      const validated = updateCartItemSchema.parse(body);

      const cart = await CartService.updateItem(ctx.user.id, id, validated);
      return apiSuccess(cart);
    } catch (error) {
      return handleRouteError(error);
    }
  }
);

export const DELETE = withAuth(
  async (req: NextRequest, ctx: AuthContext) => {
    try {
      const url = new URL(req.url);
      const segments = url.pathname.split('/');
      const id = segments[segments.length - 1];

      const cart = await CartService.removeItem(ctx.user.id, id);
      return apiSuccess(cart);
    } catch (error) {
      return handleRouteError(error);
    }
  }
);
