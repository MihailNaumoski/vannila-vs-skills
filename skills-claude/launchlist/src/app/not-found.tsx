import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center px-4">
        <h2 className="text-8xl font-bold text-brand-600 mb-4">404</h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Page not found
        </p>
        <Link
          href="/"
          className="inline-flex px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-lg shadow-brand-600/25 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
