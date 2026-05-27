import {

  LineChart,

  Line,

  CartesianGrid,

  XAxis,

  YAxis,

  Tooltip,

  ResponsiveContainer,

  BarChart,

  Bar

} from "recharts";

function DashboardCharts({

  vendas,

  pedidos

}) {

  return (

    <div className="charts-grid">

      {/* VENDAS */}

      <div className="chart-card">

        <h2>
          Faturamento
        </h2>





        <ResponsiveContainer
          width="100%"
          height={300}
        >

          <LineChart
            data={vendas}
          >

            <Line

              type="monotone"

              dataKey="valor"

              stroke="#22c55e"

              strokeWidth={4}

            />





            <CartesianGrid
              stroke="#1f2937"
            />





            <XAxis
              dataKey="dia"
            />





            <YAxis />





            <Tooltip />

          </LineChart>

        </ResponsiveContainer>

      </div>





      {/* PEDIDOS */}

      <div className="chart-card">

        <h2>
          Pedidos
        </h2>





        <ResponsiveContainer
          width="100%"
          height={300}
        >

          <BarChart
            data={pedidos}
          >

            <Bar

              dataKey="total"

              fill="#3b82f6"

            />





            <CartesianGrid
              stroke="#1f2937"
            />





            <XAxis
              dataKey="hora"
            />





            <YAxis />





            <Tooltip />

          </BarChart>

        </ResponsiveContainer>

      </div>

    </div>

  );

}

export default DashboardCharts;