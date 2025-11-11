
interface StatsPanelProps {
  stats?: any[];
}

export function StatsPanel({ stats = [] }: StatsPanelProps) {
  // Default stats if none are provided
  const playerStats = stats?.length ? stats : [
    { category: "Strength", metric: "Squat Max", value: "315 lbs", change: "+15 lbs", status: "improved" },
    { category: "Strength", metric: "Bench Press Max", value: "225 lbs", change: "+10 lbs", status: "improved" },
    { category: "Strength", metric: "Deadlift Max", value: "405 lbs", change: "+20 lbs", status: "improved" },
    { category: "Endurance", metric: "Mile Run Time", value: "5:45", change: "-0:15", status: "improved" },
    { category: "Endurance", metric: "Recovery Rate", value: "84%", change: "+2%", status: "improved" },
    { category: "Skill", metric: "Movement Accuracy", value: "92%", change: "+1%", status: "improved" },
    { category: "Skill", metric: "Technical Execution", value: "88%", change: "+3%", status: "improved" },
    { category: "Nutrition", metric: "Protein Intake", value: "145g/day", change: "+5g/day", status: "improved" }
  ];

  return (
    <div className="looker-panel-content">
      <div className="looker-panel-header">
        <h2>Performance Metrics</h2>
        <div className="looker-panel-actions">
          <button className="looker-button-sm">Filter</button>
          <button className="looker-icon-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="looker-table-container">
        <table className="looker-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Metric</th>
              <th>Value</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {playerStats.map((stat, index) => (
              <tr key={index} className="looker-table-row">
                <td>{stat.category}</td>
                <td>{stat.metric}</td>
                <td className="looker-table-value">{stat.value}</td>
                <td className={`looker-table-change ${stat.status}`}>{stat.change}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
