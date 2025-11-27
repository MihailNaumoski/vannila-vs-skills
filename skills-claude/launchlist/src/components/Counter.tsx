import { prisma } from "@/lib/prisma";

export default async function Counter() {
  const count = await prisma.waitlist.count();

  return (
    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
      Join{" "}
      <span className="font-semibold text-brand-600 dark:text-brand-400 tabular-nums">
        {count.toLocaleString()}
      </span>{" "}
      {count === 1 ? "other" : "others"} on the waitlist
    </p>
  );
}
