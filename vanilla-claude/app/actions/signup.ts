"use server";

import { prisma } from "@/lib/prisma";

type SignupResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function signup(formData: FormData): Promise<SignupResult> {
  const email = formData.get("email") as string;
  const source = formData.get("source") as string | null;
  const referrer = formData.get("referrer") as string | null;

  // Validate email
  if (!email || typeof email !== "string") {
    return { success: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Please enter a valid email address" };
  }

  // Sanitize email
  const sanitizedEmail = email.toLowerCase().trim();

  try {
    await prisma.waitlist.create({
      data: {
        email: sanitizedEmail,
        source: source || null,
        referrer: referrer || null,
      },
    });

    return { success: true, message: "You're on the list!" };
  } catch (error: unknown) {
    // Check for unique constraint violation (duplicate email)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { success: false, error: "You're already on the list!" };
    }

    console.error("Signup error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function getWaitlistCount(): Promise<number> {
  try {
    return await prisma.waitlist.count();
  } catch {
    return 0;
  }
}
