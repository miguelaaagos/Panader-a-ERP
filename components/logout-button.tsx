"use client";

import { useLogout } from "@refinedev/core";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const { mutate: logout } = useLogout();

  return (
    <Button
      onClick={() => logout()}
      variant="outline"
      size="sm"
    >
      Cerrar Sesión
    </Button>
  );
}
