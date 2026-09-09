"use client";

import type React from "react";
import { useSettingsRuntime } from "@/hooks/use-settings-runtime";

const PublicThemeRuntime: React.FC = () => {
  useSettingsRuntime();

  return null;
};

export default PublicThemeRuntime;
