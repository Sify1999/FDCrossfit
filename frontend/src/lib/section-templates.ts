// ─── Section Template API types ─────────────────────────────────────────

import { api } from "@/lib/api-client";

export type SectionTemplateCreate = {
  name: string;
  section_type: string;
  section_data: Record<string, any>;
};

export type SectionTemplateRead = {
  id: number;
  user_id: number;
  name: string;
  section_type: string;
  section_data: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export async function fetchSectionTemplates(q?: string): Promise<SectionTemplateRead[]> {
  const params = q ? `?q=${encodeURIComponent(q)}` : "";
  return api.get<SectionTemplateRead[]>(`/section-templates${params}`);
}

export async function createSectionTemplate(
  data: SectionTemplateCreate
): Promise<SectionTemplateRead> {
  return api.post<SectionTemplateRead>("/section-templates", data);
}

export async function updateSectionTemplate(
  id: number,
  data: { name?: string; section_data?: Record<string, any> }
): Promise<SectionTemplateRead> {
  return api.put<SectionTemplateRead>(`/section-templates/${id}`, data);
}

export async function deleteSectionTemplate(id: number): Promise<void> {
  return api.delete(`/section-templates/${id}`);
}

export function generateTemplateName(section: {
  type?: string | null;
  label?: string;
  movement_name?: string;
  complex_name?: string;
  format?: string | null;
}): string {
  if (section.label) return section.label;
  if (section.type === "single" && section.movement_name) return section.movement_name;
  if (section.type === "complex" && section.complex_name) return section.complex_name;
  if (section.type === "conditioning" && section.format) return section.format;
  if (section.type === "text") return "Free Text";
  return "Untitled Section";
}