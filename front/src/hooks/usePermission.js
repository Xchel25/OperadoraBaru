import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../config/roles";

export function usePermission(permission) {
  const { user } = useAuth();
  return hasPermission(user?.role, permission);
}
