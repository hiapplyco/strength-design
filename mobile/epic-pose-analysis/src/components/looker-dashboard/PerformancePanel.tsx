
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface PerformancePanelProps {
  data?: any[];
}

export function PerformancePanel({ data = [] }: PerformancePanelProps) {
  // Default data if none is provided
  const chartData = data?.length ? data : [
    { name: 'Jan', strength: 65, endurance: 78, skill: 82, overall: 75 },
    { name: 'Feb', strength: 68, endurance: 80, skill: 80, overall: 76 },
    { name: 'Mar', strength: 71, endurance: 82, skill: 81, overall: 78 },
    { name: 'Apr', strength: 74, endurance: 78, skill: 83, overall: 78 },
    { name: 'May', strength: 77, endurance: 82, skill: 85, overall: 81 },
    { name: 'Jun', strength: 80, endurance: 85, skill: 86, overall: 84 },
    { name: 'Jul', strength: 83, endurance: 87, skill: 88, overall: 86 },
  ];

  return (
    <div className="looker-panel-content">
      <div className="looker-panel-header">
        <h2>Performance Trends</h2>
        <div className="looker-panel-actions">
          <button className="looker-icon-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="looker-chart">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="name" stroke="#999" />
            <YAxis stroke="#999" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="strength" stroke="#4285F4" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="endurance" stroke="#0F9D58" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="skill" stroke="#F4B400" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="overall" stroke="#DB4437" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
