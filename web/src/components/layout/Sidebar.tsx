import {
  faChartLine,
  faBox,
  faUsers,
  faTruck,
  faGear,
  faBars,
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useState } from "react";

import { useAuth } from "../../auth/AuthContext";

export default function Sidebar() {
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState(false);

  const menu =
    user?.role === "retailer"
      ? [
          {
            label: "Dashboard",
            icon: faChartLine,
          },

          {
            label: "Deliveries",
            icon: faBox,
          },

          {
            label: "Customers",
            icon: faUsers,
          },

          {
            label: "Reports",
            icon: faChartLine,
          },

          {
            label: "Settings",
            icon: faGear,
          },
        ]
      : user?.role === "dispatcher"
        ? [
            {
              label: "Dashboard",
              icon: faChartLine,
            },

            {
              label: "Orders",
              icon: faBox,
            },

            {
              label: "Riders",
              icon: faTruck,
            },

            {
              label: "Reports",
              icon: faChartLine,
            },

            {
              label: "Settings",
              icon: faGear,
            },
          ]
        : [
            {
              label: "My Deliveries",
              icon: faTruck,
            },

            {
              label: "History",
              icon: faBox,
            },

            {
              label: "Profile",
              icon: faUsers,
            },

            {
              label: "Settings",
              icon: faGear,
            },
          ];

  return (
    <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
      >
        <FontAwesomeIcon icon={collapsed ? faBars : faChevronLeft} />
      </button>

      {!collapsed && (
        <div className="sidebar-brand">
          <strong>Reflex</strong>

          <span>Delivery</span>
        </div>
      )}

      <nav>
        {menu.map((item) => (
          <button key={item.label} className="sidebar-item">
            <FontAwesomeIcon icon={item.icon} />

            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
