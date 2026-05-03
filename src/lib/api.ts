// Type-safe API helpers for CRM-HUB
export type ApiResponse<T> = { data: T } | { error: string };

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${endpoint}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Dashboard
  dashboard: () => apiFetch<{ stats: Record<string, number>; deals: any[]; activities: any[] }>("/dashboard"),

  // Contacts
  contacts: {
    list: (q?: string) => apiFetch<any[]>(`/contacts?q=${q ?? ""}`),
    create: (body: any) => apiFetch<any>("/contacts", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: any) => apiFetch<any>(`/contacts/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) => apiFetch<void>(`/contacts/${id}`, { method: "DELETE" }),
  },

  // Companies
  companies: {
    list: (q?: string) => apiFetch<any[]>(`/companies?q=${q ?? ""}`),
    create: (body: any) => apiFetch<any>("/companies", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: any) => apiFetch<any>(`/companies/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  },

  // Deals
  deals: {
    list: () => apiFetch<any[]>("/deals"),
    create: (body: any) => apiFetch<any>("/deals", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: any) => apiFetch<any>(`/deals/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  },

  // Pipelines & Stages
  pipelines: () => apiFetch<any[]>("/pipelines"),

  // Tasks
  tasks: {
    list: () => apiFetch<any[]>("/tasks"),
    create: (body: any) => apiFetch<any>("/tasks", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: any) => apiFetch<any>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  },

  // Activities
  activities: {
    list: (entityType?: string, entityId?: string) => apiFetch<any[]>(`/activities?entityType=${entityType ?? ""}&entityId=${entityId ?? ""}`),
    create: (body: any) => apiFetch<any>("/activities", { method: "POST", body: JSON.stringify(body) }),
  },
};
