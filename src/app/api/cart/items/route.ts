import { NextRequest } from 'next/server';
import { withAuth, AuthContext } from '@/server/http/auth-guard';
import { addToCartSchema } from '@/validators';
import { CartService } from '@/server/services/cart.service';
import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';

export const POST = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const body = await req.json();
    const validated = addToCartSchema.parse(body);

    const updatedCart = await CartService.addItem(ctx.user.id, validated);
    return apiSuccess(updatedCart, undefined, 201);
  } catch (error) {
    return handleRouteError(error);
  }
});
