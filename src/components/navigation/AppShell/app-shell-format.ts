import type { useTranslation } from "@/lib/i18n/use-translation";
import type { NavItem } from "./app-shell-types";

export function navLabel(
  item: NavItem,
  t: ReturnType<typeof useTranslation>["t"],
): string {
  switch (item) {
    case "Matches":
      return t("navigation.matches");
    case "Cup":
      return t("navigation.cup");
    case "History":
      return t("navigation.history");
    case "Profile":
      return t("navigation.profile");
  }
}
