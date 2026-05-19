export const ROLES = {
  PROJECT_MANAGER: "PROJECT_MANAGER",
  ADMIN_AREA:      "ADMIN_AREA",
  RRHH:            "RRHH",
  COMUNICACION:    "COMUNICACION",
  COLABORADOR:     "COLABORADOR",
};

// Etiquetas legibles para mostrar en UI
export const ROLE_LABELS = {
  PROJECT_MANAGER: "Project Manager",
  ADMIN_AREA:      "Admin de Área",
  RRHH:            "Recursos Humanos",
  COMUNICACION:    "Comunicación y Cultura",
  COLABORADOR:     "Colaborador",
};

export const PERMISSIONS = {
  canManageUsers:     ["PROJECT_MANAGER", "RRHH"],
  canViewUsers:       ["PROJECT_MANAGER", "ADMIN_AREA", "RRHH"],
  canCreateCourses:   ["PROJECT_MANAGER", "ADMIN_AREA"],
  canDeleteCourses:   ["PROJECT_MANAGER"],
  canCreateNotices:   ["PROJECT_MANAGER", "ADMIN_AREA", "COMUNICACION"],
  canEditIndicadores: ["PROJECT_MANAGER", "ADMIN_AREA"],
  canViewReportes:    ["PROJECT_MANAGER", "ADMIN_AREA", "RRHH"],
  canCreateReportes:  ["PROJECT_MANAGER", "ADMIN_AREA", "RRHH"],
  canAccessConfig:    ["PROJECT_MANAGER"],
};

export const hasPermission = (role, permission) =>
  PERMISSIONS[permission]?.includes(role) ?? false;
