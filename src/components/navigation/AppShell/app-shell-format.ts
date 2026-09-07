import type { useTranslation } from "@/lib/i18n/use-translation";
import type { NavItem } from "./app-shell-types";

export function navLabel(item: NavItem, t: ReturnType<typeof useTranslation>["t"]): string {
  switch (item) {
    case "Predict":
      return t("navigation.predict");
    case "Cup":
      return t("navigation.cup");
    case "Rating":
      return t("navigation.rating");
    case "Profile":
      return t("navigation.profile");
  }
}
