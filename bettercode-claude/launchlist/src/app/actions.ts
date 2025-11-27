"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const emailSchema = z.string().email("Please enter a valid email address");

export type SignupState = {
  success?: boolean;
  message?: string;
  error?: string;
} | null;

export async function submitWaitlist(
  prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const email = formData.get("email") as string;
  const source = formData.get("utm_source") as string | null;
  const referrer = formData.get("referrer") as string | null;

  // Validate email
  const result = emailSchema.safeParse(email);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    await prisma.waitlist.create({
      data: {
        email: result.data.toLowerCase().trim(),
        source: source || null,
        referrer: referrer || null,
      },
    });

    // Revalidate to update counter
    revalidatePath("/");

    return {
      success: true,
      message: "You're on the list! We'll be in touch soon.",
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return { error: "You're already on the waitlist!" };
      }
    }
    console.error("Signup error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
