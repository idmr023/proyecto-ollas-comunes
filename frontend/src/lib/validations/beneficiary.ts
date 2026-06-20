import { z } from "zod"

export const beneficiarySchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido").max(100),
  lastName: z.string().min(1, "El apellido es requerido").max(100),
  dni: z.string().min(1, "El DNI es requerido").max(20),
  birthDate: z.string().min(1, "La fecha de nacimiento es requerida"),
  gender: z.enum(["male", "female", "other", "not_specified"]),
  priorityLevel: z.enum(["low", "normal", "high"]),
  phone: z.string().optional(),
  address: z.string().optional(),
  ollaId: z.string().min(1, "La olla común es requerida"),
  healthConditionIds: z.array(z.number()).default([]),
})

export type BeneficiaryFormData = z.infer<typeof beneficiarySchema>
