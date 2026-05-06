export default function Loading() {
  return (
    <div className="h-screen flex items-center justify-center" style={{ backgroundColor: "#08090a" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-[3px] border-[#5e6ad2] border-t-transparent rounded-full animate-spin"/>
        <p className="text-sm animate-pulse" style={{ color: "#62666d" }}>Loading...</p>
      </div>
    </div>
  );
}
