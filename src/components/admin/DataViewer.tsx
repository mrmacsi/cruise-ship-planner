interface CacheData {
  total_keys: number;
  retrieved_at: string;
  caches: Array<{
    key: string;
    type: string;
    data: unknown;
  }>;
}

interface DataViewerProps {
  allCacheData: CacheData | Record<string, never>;
}

export default function DataViewer({ allCacheData }: DataViewerProps) {
  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <h3 className="font-semibold mb-4">All Cache Data</h3>
      <div className="space-y-4">
        {allCacheData.caches ? (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Total keys: {allCacheData.total_keys} | Retrieved: {new Date(allCacheData.retrieved_at).toLocaleString()}
            </p>
            {allCacheData.caches.map((cache, index: number) => (
              <div key={index} className="border rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{cache.key}</h4>
                  <span className="text-xs text-gray-500">{cache.type}</span>
                </div>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(cache.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No cache data available</p>
        )}
      </div>
    </div>
  );
} 