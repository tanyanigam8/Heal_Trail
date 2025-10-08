import React from 'react';

function TrendTable({ data }) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-600">No trend data available.</p>;

  const metricKeys = Object.keys(data[0]).filter(k => k !== 'date');

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">📈 Trend Analysis Table</h3>
      <div className="overflow-x-auto border rounded bg-white shadow">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2 border-b">Date</th>
              {metricKeys.map(key => (
                <th key={key} className="px-4 py-2 border-b">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((entry, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b">{entry.date}</td>
                {metricKeys.map(key => (
                  <td key={key} className="px-4 py-2 border-b">{entry[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TrendTable;
