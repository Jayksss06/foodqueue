import { prisma } from '@/lib/prisma';
import { CartView, CartItemView } from '@/types';
import { Pricing } from '../domain/pricing';

export class CartService {
  /**
   * Mengambil keranjang belanja aktif customer beserta validasi harga dan ketersediaan terkini
   */
  public static async getCart(userId: string): Promise<CartView> {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        tenant: {
          select: { id: true, name: true, status: true, isAcceptingOrders: true },
        },
        items: {
          include: {
            menu: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
                stock: true,
                status: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return {
        id: cart?.id || '',
        tenantId: null,
        tenantName: null,
        items: [],
        subtotal: 0,
        fee: 0,
        total: 0,
        itemCount: 0,
        hasUnavailableItems: false,
        hasPriceChanges: false,
      };
    }

    let hasUnavailableItems = false;
    let hasPriceChanges = false;

    const itemsView: CartItemView[] = cart.items.map((item) => {
      const isDeleted = !!item.menu.deletedAt;
      const isAvailable =
        !isDeleted &&
        item.menu.status === 'AVAILABLE' &&
        item.menu.stock >= item.quantity;

      if (!isAvailable) {
        hasUnavailableItems = true;
      }

      const priceChanged = item.priceSnapshot !== item.menu.price;
      if (priceChanged) {
        hasPriceChanges = true;
      }

      return {
        id: item.id,
        menuId: item.menuId,
        name: item.menu.name,
        price: item.priceSnapshot,
        imageUrl: item.menu.imageUrl,
        quantity: item.quantity,
        notes: item.notes,
        stock: item.menu.stock,
        isAvailable,
        priceChanged,
        currentPrice: item.menu.price,
        subtotal: item.priceSnapshot * item.quantity,
      };
    });

    const pricing = Pricing.calculateTotals(
      itemsView.map((i) => ({ price: i.price, quantity: i.quantity }))
    );

    return {
      id: cart.id,
      tenantId: cart.tenantId,
      tenantName: cart.tenant?.name ?? null,
      items: itemsView,
      subtotal: pricing.subtotal,
      fee: pricing.fee,
      total: pricing.total,
      itemCount: pricing.itemCount,
      hasUnavailableItems,
      hasPriceChanges,
    };
  }

  /**
   * Menambah menu ke dalam keranjang
   */
  public static async addItem(
    userId: string,
    input: {
      menuId: string;
      quantity: number;
      notes?: string;
      replaceCart?: boolean;
    }
  ): Promise<CartView> {
    const menu = await prisma.menu.findUnique({
      where: { id: input.menuId },
      include: {
        tenant: {
          select: { id: true, name: true, status: true, isAcceptingOrders: true },
        },
      },
    });

    if (!menu || menu.deletedAt) {
      throw new Error('NOT_FOUND: Menu tidak ditemukan.');
    }

    if (menu.tenant.status !== 'ACTIVE' || !menu.tenant.isAcceptingOrders) {
      throw new Error('TENANT_CLOSED: Tenant sedang tutup atau tidak menerima pesanan.');
    }

    if (menu.status !== 'AVAILABLE' || menu.stock <= 0) {
      throw new Error('MENU_OUT_OF_STOCK: Menu sedang habis.');
    }

    if (input.quantity > menu.stock) {
      throw new Error(`INSUFFICIENT_STOCK: Stok ${menu.name} hanya tersisa ${menu.stock}.`);
    }

    // Ambil atau buat cart untuk user ini
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          tenantId: menu.tenantId,
        },
        include: { items: true },
      });
    }

    // Aturan BR-05: Satu checkout hanya boleh dari satu tenant
    if (cart.tenantId && cart.tenantId !== menu.tenantId && cart.items.length > 0) {
      if (input.replaceCart) {
        // Hapus item sebelumnya dan ganti tenant
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        await prisma.cart.update({
          where: { id: cart.id },
          data: { tenantId: menu.tenantId },
        });
      } else {
        throw new Error(
          'CART_TENANT_CONFLICT: Keranjang belanja Anda berisi pesanan dari tenant lain. Kosongkan keranjang terlebih dahulu.'
        );
      }
    }

    // Jika cart kosong atau tenantId belum diset
    if (!cart.tenantId || cart.items.length === 0) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { tenantId: menu.tenantId },
      });
    }

    // Cek apakah item sudah ada di cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_menuId: {
          cartId: cart.id,
          menuId: menu.id,
        },
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + input.quantity;
      if (newQuantity > menu.stock) {
        throw new Error(`INSUFFICIENT_STOCK: Stok ${menu.name} hanya tersisa ${menu.stock}.`);
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          priceSnapshot: menu.price,
          notes: input.notes !== undefined ? input.notes : existingItem.notes,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          menuId: menu.id,
          quantity: input.quantity,
          priceSnapshot: menu.price,
          notes: input.notes || null,
        },
      });
    }

    return this.getCart(userId);
  }

  /**
   * Mengubah quantity atau catatan item dalam keranjang
   */
  public static async updateItem(
    userId: string,
    itemId: string,
    input: { quantity: number; notes?: string }
  ): Promise<CartView> {
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        menu: { select: { name: true, stock: true, price: true } },
      },
    });

    if (!item || item.cart.userId !== userId) {
      throw new Error('NOT_FOUND: Item keranjang tidak ditemukan.');
    }

    if (input.quantity > item.menu.stock) {
      throw new Error(
        `INSUFFICIENT_STOCK: Stok ${item.menu.name} hanya tersisa ${item.menu.stock}.`
      );
    }

    if (input.quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: itemId },
        data: {
          quantity: input.quantity,
          priceSnapshot: item.menu.price, // update snapshot ke harga terbaru
          notes: input.notes !== undefined ? input.notes : item.notes,
        },
      });
    }

    return this.getCart(userId);
  }

  /**
   * Menghapus satu item dari keranjang
   */
  public static async removeItem(userId: string, itemId: string): Promise<CartView> {
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new Error('NOT_FOUND: Item keranjang tidak ditemukan.');
    }

    await prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
  }

  /**
   * Mengosongkan keranjang belanja
   */
  public static async clearCart(userId: string): Promise<void> {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.cart.update({
        where: { id: cart.id },
        data: { tenantId: null },
      });
    }
  }
}
