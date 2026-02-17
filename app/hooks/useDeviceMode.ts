"use client";

import { useEffect, useState } from "react";

export type DeviceMode = "mobile" | "tablet" | "desktop";

export function useDeviceMode(): DeviceMode {
  const [mode, setMode] = useState<DeviceMode>("desktop");

  useEffect(() => {
    const check = () => {
      const width = window.innerWidth;

      if (width < 640) setMode("mobile");
      else if (width < 1024) setMode("tablet");
      else setMode("desktop");
    };

    check();
    window.addEventListener("resize", check);

    return () => window.removeEventListener("resize", check);
  }, []);

  return mode;
}