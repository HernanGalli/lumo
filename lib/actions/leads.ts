"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { deleteFromBucket } from "@/lib/supabase/storage";

const LEAD_STATUSES = ["new", "contacted", "closed"] as const;

const updateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(LEAD_STATUSES),
});

export async function updateLeadStatus(formData: FormData) {
  const supabase = await createClient();
  const { id, status } = updateStatusSchema.parse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  const { error } = await supabase.from("corporate_leads").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/leads");
}

const notesSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
});

export async function updateLeadNotes(formData: FormData) {
  const supabase = await createClient();
  const { id, notes } = notesSchema.parse({
    id: formData.get("id"),
    notes: formData.get("notes") || "",
  });

  const { error } = await supabase.from("corporate_leads").update({ notes: notes || null }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/leads");
}

export async function deleteLead(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));

  const { data: lead } = await supabase
    .from("corporate_leads")
    .select("reference_file_path")
    .eq("id", id)
    .single();
  if (lead?.reference_file_path) {
    await deleteFromBucket(supabase, "leads", lead.reference_file_path);
  }

  const { error } = await supabase.from("corporate_leads").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/leads");
}
