import { prisma } from '@/lib/prisma';
import { NotificationType } from '@/types';

export class NotificationService {
  /**
   * Membuat notifikasi in-app untuk user tertentu
   */
  public static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = 'ORDER',
    link?: string
  ) {
    try {
      return await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          link: link || null,
        },
      });
    } catch (err) {
      console.error('Failed to create in-app notification:', err);
      return null;
    }
  }

  /**
   * Mengambil daftar notifikasi milik user
   */
  public static async getUserNotifications(
    userId: string,
    unreadOnly = false,
    page = 1,
    pageSize = 20
  ) {
    const where: any = { userId };
    if (unreadOnly) {
      where.readAt = null;
    }

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return {
      items,
      unreadCount,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Menandai satu notifikasi sebagai telah dibaca
   */
  public static async markAsRead(userId: string, notificationId: string) {
    return await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
  }

  /**
   * Menandai semua notifikasi milik user sebagai telah dibaca
   */
  public static async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
