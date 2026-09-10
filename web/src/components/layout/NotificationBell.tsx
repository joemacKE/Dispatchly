import { useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faBell, faCheck } from "@fortawesome/free-solid-svg-icons";

import { useNotifications } from "../../notifications/NotificationContext";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);

  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

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
