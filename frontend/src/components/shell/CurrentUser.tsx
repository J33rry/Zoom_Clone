"use client";

import { createContext, type ReactNode, useContext } from "react";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import type { User } from "@/types/api";

const CurrentUserContext = createContext<User | undefined>(undefined);

/** No login yet: the API's default user is treated as signed in. */
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { data } = useAsync(() => api.me(), []);
  return <CurrentUserContext.Provider value={data}>{children}</CurrentUserContext.Provider>;
}

export const useCurrentUser = () => useContext(CurrentUserContext);
