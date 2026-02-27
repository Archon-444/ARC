import Link from 'next/link';
import { Hexagon } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200/60 dark:border-gray-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary-500 flex items-center justify-center">
            <Hexagon className="h-3 w-3 text-white fill-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">ArcMarket</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">&copy; {new Date().getFullYear()} Inc.</span>
        </div>
        <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/privacy" className="hover:text-primary-500 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-primary-500 transition-colors">Terms of Service</Link>
          <Link href="/help" className="hover:text-primary-500 transition-colors">Help Center</Link>
        </div>
      </div>
    </footer>
  );
}
