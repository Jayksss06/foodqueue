import { prisma } from '@/lib/prisma';
import { UserSession } from '@/types';
import { NotificationService } from './notification.service';

export class ReviewService {
  /**
   * Memberikan rating dan review untuk pesanan yang telah selesai (COMPLETED)
   */
  public static async createReview(
    user: UserSession,
    orderId: string,
    input: { rating: number; comment?: string }
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        review: true,
        tenant: { select: { id: true, name: true, ownerId: true } },
      },
    });

    if (!order || order.userId !== user.id) {
      throw new Error('NOT_FOUND: Pesanan tidak ditemukan.');
    }

    if (order.status !== 'COMPLETED') {
      throw new Error('REVIEW_NOT_ALLOWED: Ulasan hanya dapat diberikan setelah pesanan selesai diambil.');
    }

    if (order.review) {
      throw new Error('REVIEW_EXISTS: Anda sudah pernah memberikan ulasan untuk pesanan ini.');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Buat record review
      const review = await tx.review.create({
        data: {
          orderId: order.id,
          userId: user.id,
          tenantId: order.tenantId,
          rating: input.rating,
          comment: input.comment?.trim() || null,
        },
      });

      // 2. Hitung ulang rata-rata rating tenant
      const aggregate = await tx.review.aggregate({
        where: {
          tenantId: order.tenantId,
          isHidden: false,
        },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const ratingAvg = Math.round((aggregate._avg.rating || 0) * 10) / 10;
      const ratingCount = aggregate._count.rating || 0;

      await tx.tenant.update({
        where: { id: order.tenantId },
        data: {
          ratingAvg,
          ratingCount,
        },
      });

      // 3. Beri notifikasi ke pemilik tenant
      await NotificationService.createNotification(
        order.tenant.ownerId,
        'Ulasan Baru Diterima ⭐',
        `Pelanggan memberikan rating ${input.rating}/5 untuk pesanan #${order.orderNumber}.`,
        'REVIEW',
        `/tenant/reviews`
      );

      return review;
    });
  }

  /**
   * Mengambil ulasan untuk tenant tertentu
   */
  public static async getTenantReviews(tenantId: string, page = 1, pageSize = 10) {
    const where = { tenantId, isHidden: false };

    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
          order: { select: { id: true, orderNumber: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.review.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
