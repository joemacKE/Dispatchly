import {
  faTable,
  faChartLine,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  activeView: "deliveries" | "dashboard";

  setActiveView: (view: "deliveries" | "dashboard") => void;
};

export default function DispatcherSidebar({
  activeView,
  setActiveView,
}: Props) {
  return (
    <aside className="dispatcher-sidebar">
      <h2>Dispatchly</h2>

      <button
        className={
          activeView === "deliveries" ? "sidebar-item active" : "sidebar-item"
        }
        onClick={() => setActiveView("deliveries")}
      >
        <FontAwesomeIcon icon={faTable} />
        Deliveries
      </button>

      <button
        className={
          activeView === "dashboard" ? "sidebar-item active" : "sidebar-item"
        }
        onClick={() => setActiveView("dashboard")}
      >
        <FontAwesomeIcon icon={faChartLine} />
        Dashboard
      </button>

      <button className="sidebar-item">
        <FontAwesomeIcon icon={faUsers} />
        Riders
      </button>
    </aside>
  );
}
