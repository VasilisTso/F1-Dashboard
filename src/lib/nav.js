import { LuLayoutDashboard, LuUser, LuShield, LuFlag } from "react-icons/lu";

export const NAV_ITEMS = [
  { to: "/overview", labelKey: "common.nav.overview", icon: LuLayoutDashboard },
  { to: "/drivers", labelKey: "common.nav.drivers", icon: LuUser },
  { to: "/constructors", labelKey: "common.nav.constructors", icon: LuShield },
  { to: "/races", labelKey: "common.nav.races", icon: LuFlag },
];
