"use client";

import { signOutAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <Button
      onClick={async () => await signOutAction()}
      variant="outline"
      size="sm"
    >
      Cerrar Sesión
    </Button>
  );
}
