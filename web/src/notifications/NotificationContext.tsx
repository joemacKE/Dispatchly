import { createContext, useContext, useState, type ReactNode } from "react";

export type Notification = {
  id: string;

  title: string;

  message: string;

  time: string;

  read: boolean;

  type?: string;
};

type NotificationContextType = {
  notifications: Notification[];

  unreadCount: number;

  addNotification: (notification: Omit<Notification, "id" | "read">) => void;

  markAsRead: (id: string) => void;

  markAllAsRead: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  function addNotification(notification: Omit<Notification, "id" | "read">) {
    const newNotification: Notification = {
      id: crypto.randomUUID(),

      ...notification,

      read: false,
    };

    setNotifications((current) => [newNotification, ...current]);
  }

  function markAsRead(id: string) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification,
      ),
    );
  }

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    );
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,

        unreadCount,

        addNotification,

        markAsRead,

        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider",
    );
  }

  return context;
}
