import React from 'react';
import { Bar } from 'react-chartjs-2';

// ✅ Register required chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Chart({ label, value, normalRange }) {
  const data = {
    labels: [label],
    datasets: [
      {
        label: 'Value',
        data: [value],
        backgroundColor:
          value < normalRange[0] || value > normalRange[1]
            ? '#ef4444'
            : '#10b981',
      },
    ],
  };

  const options = {
    indexAxis: 'y',
    scales: {
      x: {
        min: Math.min(value, normalRange[0]) - 2,
        max: Math.max(value, normalRange[1]) + 2,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="p-4">
      <Bar data={data} options={options} />
    </div>
  );
}

export default Chart;
