import { useEffect, useState } from "react";
import { fetchMe, type Me } from "../lib/api";

export function useMe() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetchMe()
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  return me;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
