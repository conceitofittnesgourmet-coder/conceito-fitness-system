import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

function moeda(valor) {
  return `R$ ${Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DashboardCharts({ vendas = [], pedidos = [] }) {
  return (
    <div className="charts-grid">
      <div className="chart-card">
        <h2>Faturamento, CMV e lucro</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={vendas}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="dia" />
            <YAxis />
            <Tooltip formatter={(valor) => moeda(valor)} />
            <Legend />
            <Line type="monotone" dataKey="faturamento" name="Faturamento" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="cmv" name="CMV" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="lucro" name="Lucro" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h2>Pedidos por horário</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={pedidos}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="hora" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="total" name="Pedidos" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
