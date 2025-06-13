import type { CityLimitStats, UkTaxYearStats } from '@/utils/constants';

interface StatisticsProps {
  cityLimits: Record<string, CityLimitStats>;
  ukTaxYearStats: Record<string, UkTaxYearStats>;
}

export default function Statistics({ cityLimits, ukTaxYearStats }: StatisticsProps) {
  return (
    <>
      {/* City-specific Schengen Checklist */}
      <div className="bg-white p-4 rounded shadow-sm mb-6">
        <h3 className="font-semibold mb-2">City-Specific Schengen Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(cityLimits).map(([city, stats]) => (
            <div key={city} className={`p-3 rounded border ${stats.hasOverLimit ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={!stats.hasOverLimit} 
                  readOnly
                  className="mr-2"
                />
                <span className="font-medium">{city}</span>
              </div>
              <div className="mt-2 text-sm">
                <p>Total days: {stats.totalDays}</p>
                <p>Max in any 180-day period: {stats.maxInAnyWindow}/90</p>
                {stats.hasOverLimit && (
                  <p className="text-red-600 font-semibold mt-1">
                    Exceeds 90-day limit! Reduce stay by {stats.maxInAnyWindow - 90} days.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* UK Tax Year Requirement Checklist */}
      <div className="bg-white p-4 rounded shadow-sm mb-6">
        <h3 className="font-semibold mb-2">UK Tax Residency Requirement (91 days)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(ukTaxYearStats).map(([taxYear, stats]) => (
            <div key={taxYear} className={`p-3 rounded border ${stats.meetsRequirement ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}`}>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={stats.meetsRequirement} 
                  readOnly
                  className="mr-2"
                />
                <span className="font-medium">Tax Year {taxYear}</span>
              </div>
              <div className="mt-2 text-sm">
                <p>Days in UK: {stats.daysInUk}/90 required</p>
                {!stats.meetsRequirement && (
                  <p className="text-yellow-600 font-semibold mt-1">
                    Need {stats.daysNeeded} more days in UK
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
} 