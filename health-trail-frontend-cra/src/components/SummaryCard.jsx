import React from 'react';

function SummaryCard({ label, value, normalRange }) {
  const isAbnormal = value < normalRange[0] || value > normalRange[1];

  return (
    <div className={`p-4 border rounded shadow ${isAbnormal ? 'bg-red-100' : 'bg-green-100'}`}>
      <h4 className="font-semibold">{label}</h4>
      <p>{value}</p>
    </div>
  );
}

export default SummaryCard;
