import type { Trip } from '@/utils/constants';

interface AdminPanelProps {
  adminData: string;
  setAdminData: (data: string) => void;
  onSave: (setTrips: (trips: Trip[]) => void) => Promise<boolean>;
  onRefresh: () => void;
  setTrips: (trips: Trip[]) => void;
}

export default function AdminPanel({ adminData, setAdminData, onSave, onRefresh, setTrips }: AdminPanelProps) {
  const handleSave = async () => {
    await onSave(setTrips);
  };

  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <h3 className="font-semibold mb-4">Edit Planner Data (JSON)</h3>
      <textarea
        value={adminData}
        onChange={(e) => setAdminData(e.target.value)}
        className="w-full h-64 p-3 border rounded font-mono text-sm"
        placeholder="JSON data will appear here..."
      />
      <div className="mt-4 flex gap-2">
        <button 
          onClick={handleSave}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Save Changes
        </button>
        <button 
          onClick={onRefresh}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Refresh
        </button>
      </div>
    </div>
  );
} 