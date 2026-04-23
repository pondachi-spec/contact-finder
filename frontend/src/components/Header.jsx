export default function Header() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xl">
          🔍
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-300 via-violet-300 to-slate-200 bg-clip-text text-transparent">
          Contact Finder
        </h1>
      </div>
      <p className="text-slate-500 text-sm ml-13 pl-[52px]">
        Skip trace property owners · Find phone numbers & emails · Export results
      </p>
    </div>
  );
}
