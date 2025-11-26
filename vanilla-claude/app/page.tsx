import { Suspense } from "react";
import { WaitlistSection } from "@/components/WaitlistSection";
import { Footer } from "@/components/Footer";
import { getWaitlistCount } from "@/app/actions/signup";

async function WaitlistWithCount() {
  const count = await getWaitlistCount();
  return <WaitlistSection initialCount={count} />;
}

function WaitlistLoading() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 h-12 bg-white/10 rounded-lg animate-pulse" />
          <div className="w-32 h-12 bg-blue-800/50 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              LaunchList
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 mb-4">
              The simplest way to build your launch waitlist
            </p>
            <p className="text-white/60 max-w-md mx-auto">
              Collect emails, track signups, and measure interest before you
              launch. Simple setup, essential analytics.
            </p>
          </div>

          {/* Signup Form & Counter */}
          <Suspense fallback={<WaitlistLoading />}>
            <WaitlistWithCount />
          </Suspense>
        </div>
      </div>

      <Footer />
    </main>
  );
}
