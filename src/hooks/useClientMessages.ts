import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/integrations/api/client";

export type ClientMessages = {
  authNotice: string;
  checkoutNotice: string;
};

export function useClientMessages() {
  return useQuery({
    queryKey: ["client-messages"],
    queryFn: async () => apiRequest<ClientMessages>("/api/client-messages"),
  });
}
