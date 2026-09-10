import { useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faBell, faCheck } from "@fortawesome/free-solid-svg-icons";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      title: "Delivery Assigned",
      message: "A rider has been assigned to one of your deliveries.",
      time: "2 min ago",
      read: false,
    },
    {
      id: "2",
      title: "Delivery Completed",
      message: "A customer delivery has been completed successfully.",
      time: "12 min ago",
      read: false,
    },
    {
      id: "3",
      title: "Pickup Verified",
      message: "A rider verified pickup and started the delivery.",
      time: "25 min ago",
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

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

  return (
    <div className="notification-center">
      <button
        type="button"
        className="notification-bell-button"
        aria-label="Open notifications"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <FontAwesomeIcon icon={faBell} />

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <div>
              <h3>Notifications</h3>

              <p>
                {unreadCount === 0
                  ? "You're all caught up"
                  : `${unreadCount} unread notification${
                      unreadCount === 1 ? "" : "s"
                    }`}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-mark-all"
                onClick={markAllAsRead}
              >
                <FontAwesomeIcon icon={faCheck} />

                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">No notifications yet.</div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={`notification-item ${
                    notification.read ? "read" : "unread"
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-item-dot" />

                  <div className="notification-item-content">
                    <div className="notification-item-top">
                      <strong>{notification.title}</strong>

                      <span>{notification.time}</span>
                    </div>

                    <p>{notification.message}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
