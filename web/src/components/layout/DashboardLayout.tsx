import Sidebar from "./Sidebar";

import Navbar from "./Navbar";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;

  live?: boolean;
};

export default function DashboardLayout({ children, live = false }: Props) {
  return (
    <div className="dashboard-layout">
      <Navbar live={live} />

      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
