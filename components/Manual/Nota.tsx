export function Nota({ children }: { children: React.ReactNode }) {
  return (
    <aside className="my-6 border-l-2 border-primary-900 bg-secondary-500 px-4 py-3 text-[15px] leading-6 text-primary-800 [&_p]:m-0">
      {children}
    </aside>
  );
}
