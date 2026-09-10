import type { UserRole } from "../types";

export default function getRoleHome(
  role?: UserRole,
) {
  switch (role) {
    case "retailer":
      return "/dashboard";

    case "dispatcher":
      return "/dispatcher";

    case "rider":
      return "/rider";

    default:
      return "/";
  }
}