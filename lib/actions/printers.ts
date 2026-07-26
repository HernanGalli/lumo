"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const printerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  watts: z.coerce.number().min(0).max(100_000),
});

export async function createPrinter(formData: FormData) {
  const supabase = await createClient();
  const printer = printerSchema.parse({
    name: formData.get("name"),
    watts: formData.get("watts"),
  });

  const { error } = await supabase.from("printers").insert(printer);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/materiales");
  revalidatePath("/admin/calculadora");
}

export async function updatePrinter(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));
  const printer = printerSchema.parse({
    name: formData.get("name"),
    watts: formData.get("watts"),
  });

  const { error } = await supabase.from("printers").update(printer).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/materiales");
  revalidatePath("/admin/calculadora");
}

export async function deletePrinter(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));

  const { error } = await supabase.from("printers").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/materiales");
  revalidatePath("/admin/calculadora");
}
