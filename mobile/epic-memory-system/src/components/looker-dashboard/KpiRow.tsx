
interface KpiRowProps {
  dashboardData: any;
}

export function KpiRow({ dashboardData }: KpiRowProps) {
  const kpis = [
    {
      label: "Performance Score",
      value: dashboardData.performanceScore || "87",
      unit: "/100",
      change: "+4%",
      positive: true
    },
    {
      label: "Training Sessions",
      value: dashboardData.trainingSessions || "24",
      unit: "",
      change: "+12%",
      positive: true
    },
    {
      label: "Team Ranking",
      value: dashboardData.teamRanking || "#3",
      unit: "",
      change: "-1",
      positive: false
    },
    {
      label: "Completion Rate",
      value: dashboardData.completionRate || "92%",
      unit: "",
      change: "+3%",
      positive: true
    }
  ];
  
  return (
    <div className="looker-kpi-row">
      {kpis.map((kpi, index) => (
        <div key={index} className="looker-kpi">
          <div className="looker-kpi-label">{kpi.label}</div>
          <div className="looker-kpi-value">
            {kpi.value}{kpi.unit}
            <span className={`looker-kpi-change ${kpi.positive ? 'positive' : 'negative'}`}>
              {kpi.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
