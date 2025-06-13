interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex mb-4 border-b">
      <button 
        className={`px-4 py-2 ${activeTab === 'planner' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        onClick={() => onTabChange('planner')}
      >
        Travel Planner
      </button>
      <button 
        className={`px-4 py-2 ml-4 ${activeTab === 'admin' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        onClick={() => onTabChange('admin')}
      >
        Admin
      </button>
    </div>
  );
} 