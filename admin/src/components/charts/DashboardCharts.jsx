import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardCharts({ vendas = [], pedidos = [] }) {
  return (
    <div className="charts-grid">
      <div className="chart-card">
        <h2>Vendas da Semana</h2>

        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={vendas}>
            <XAxis dataKey="dia" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="valor" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h2>Pedidos por Horário</h2>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={pedidos}>
            <XAxis dataKey="hora" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}