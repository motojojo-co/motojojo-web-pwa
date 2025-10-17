export default function VideoPlaceholder() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
