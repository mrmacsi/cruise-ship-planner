export default function InfoPanel() {
  return (
    <div className="mb-6 p-4 bg-gray-100 rounded shadow-sm">
      <h3 className="font-semibold mb-2">Schengen Area Rules</h3>
      <p className="text-sm mb-2">You can stay a maximum of 90 days in any 180-day period in the Schengen Area.</p>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
          <span className="text-xs">Within limit</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
          <span className="text-xs">Over 90-day limit</span>
        </div>
      </div>
    </div>
  );
} 