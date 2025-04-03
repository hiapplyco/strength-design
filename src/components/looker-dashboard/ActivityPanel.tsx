
interface ActivityPanelProps {
  activities?: any[];
}

export function ActivityPanel({ activities = [] }: ActivityPanelProps) {
  // Default activities if none are provided
  const recentActivities = activities?.length ? activities : [
    {
      date: "2023-06-15",
      time: "10:30 AM",
      type: "Training Session",
      details: "High-intensity strength training"
    },
    {
      date: "2023-06-14",
      time: "2:15 PM",
      type: "Team Practice",
      details: "Team scrimmage and tactical drills"
    },
    {
      date: "2023-06-13",
      time: "9:00 AM",
      type: "Recovery",
      details: "Mobility and recovery protocol"
    }
  ];

  return (
    <div className="looker-panel-content">
      <div className="looker-panel-header">
        <h2>Recent Activities</h2>
        <div className="looker-panel-actions">
          <button className="looker-button-sm">View All</button>
        </div>
      </div>
      
      <div className="looker-activity-list">
        {recentActivities.map((activity, index) => (
          <div key={index} className="looker-activity-item">
            <div className="looker-activity-dot"></div>
            <div className="looker-activity-content">
              <div className="looker-activity-header">
                <span className="looker-activity-type">{activity.type}</span>
                <span className="looker-activity-date">{activity.date} • {activity.time}</span>
              </div>
              <div className="looker-activity-details">{activity.details}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
