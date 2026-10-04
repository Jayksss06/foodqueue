import { NotificationType } from '@/types';

export interface SendNotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

export interface NotificationChannel {
  send(payload: SendNotificationPayload): Promise<void>;
}
