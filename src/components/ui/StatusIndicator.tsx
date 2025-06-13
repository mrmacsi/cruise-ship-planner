interface StatusIndicatorProps {
  saveStatus: string;
  onReset: () => void;
}

export default function StatusIndicator({ saveStatus, onReset }: StatusIndicatorProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-4">
        {saveStatus && <span className="text-sm">{saveStatus}</span>}
        <button 
          onClick={onReset}
          className="bg-gray-500 text-white px-4 py-2 rounded text-sm"
        >
          Reset to Default Trips
        </button>
      </div>
    </div>
  );
} 