import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { CartService } from '@/server/services/cart.service';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const GET = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const cart = await CartService.getCart(ctx.user.id);
    return apiSuccess(cart);
  } catch (error) {
    return handleRouteError(error);
  }
});

export const DELETE = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await CartService.clearCart(ctx.user.id);
    return apiSuccess({ message: 'Keranjang belanja berhasil dikosongkan.' });
  } catch (error) {
    return handleRouteError(error);
  }
});
