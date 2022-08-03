import Link from 'next/link';

export default function Menu() {
  return (
    <div className="relative bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center border-b-2 border-gray-100 py-6 md:justify-start md:space-x-10">
          
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <a href="#">PoliData</a>
          </div>

          <div className="-mr-2 -my-2 md:hidden">
            <button type="button" className="bg-white rounded-md p-2 inline-flex items-center justify-center text-slate-900 hover:text-slate-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500" aria-expanded="false">
              <span className="sr-only">Abrir menu</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <nav className="hidden md:flex space-x-10">

            <Link href="/search">
              <a className="text-base font-medium text-slate-900 hover:text-slate-600"> Data Search </a>
            </Link>
            <Link href="/tools">
              <a className="text-base font-medium text-slate-900 hover:text-slate-600"> Data Tools </a>
            </Link>
            <Link href="/support">
              <a className="text-base font-medium text-slate-900 hover:text-slate-600"> Support </a>
            </Link>

          </nav>

          <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
            <a href="#" className="whitespace-nowrap text-base font-medium text-slate-600 hover:text-slate-900"> Sign in </a>
            <a href="#" className="ml-8 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-base font-medium text-white bg-slate-600 hover:bg-slate-700"> Sign up </a>
          </div>
          
        </div>
      </div>
    </div>
  );
};
