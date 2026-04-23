export const getLocationColor = (location: string): string => {
  const colors = [
    "bg-red-50 text-red-700 border-red-200",
    "bg-orange-50 text-orange-700 border-orange-200",
    "bg-amber-50 text-amber-700 border-amber-200",
    "bg-yellow-50 text-yellow-700 border-yellow-200",
    "bg-lime-50 text-lime-700 border-lime-200",
    "bg-green-50 text-green-700 border-green-200",
    "bg-emerald-50 text-emerald-700 border-emerald-200",
    "bg-teal-50 text-teal-700 border-teal-200",
    "bg-cyan-50 text-cyan-700 border-cyan-200",
    "bg-sky-50 text-sky-700 border-sky-200",
    "bg-blue-50 text-blue-700 border-blue-200",
    "bg-indigo-50 text-indigo-700 border-indigo-200",
    "bg-violet-50 text-violet-700 border-violet-200",
    "bg-purple-50 text-purple-700 border-purple-200",
    "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    "bg-pink-50 text-pink-700 border-pink-200",
    "bg-rose-50 text-rose-700 border-rose-200",
  ];
  
  if (!location) return "bg-stone-50 text-stone-600 border-stone-200";
  
  let hash = 0;
  for (let i = 0; i < location.length; i++) {
    hash = location.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
