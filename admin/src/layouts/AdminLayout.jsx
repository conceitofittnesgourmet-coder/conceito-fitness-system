import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  FaChartLine,
  FaBoxOpen,
  FaReceipt,
  FaUsers,
  FaWallet,
  FaChartPie,
  FaUtensils,
  FaTruck,
  FaSignOutAlt,
  FaStore,
} from "react-icons/fa";

function AdminLayout({
  children,
  title = "Painel Administrativo",
  subtitle = "Controle total da operação",
}) {
  const adminStorage = localStorage.getItem("admin");

  let admin = null;

  try {
    admin = adminStorage ? JSON.parse(adminStorage) : null;
  } catch {
    admin = null;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    window.location.href = "/login";
  }

  const menu = [
    {
  label: "PDV",
  path: "/pdv",
  icon: <ShoppingCart size={20} />
},
    { label: "Painel", path: "/", icon: <FaChartLine /> },
    { label: "Produtos", path: "/produtos", icon: <FaBoxOpen /> },
    { label: "Pedidos", path: "/pedidos", icon: <FaReceipt /> },
    { label: "Cozinha", path: "/cozinha", icon: <FaUtensils /> },
    { label: "Entregador", path: "/entregador", icon: <FaTruck /> },
    { label: "Clientes", path: "/clientes", icon: <FaUsers /> },
    { label: "Financeiro", path: "/financeiro", icon: <FaWallet /> },
    { label: "Caixa", path: "/caixa", icon: <FaWallet /> },
    { label: "Analytics", path: "/analytics", icon: <FaChartPie /> },
    ];

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            <FaStore />
          </div>

          <div>
            <h2>CONCEITO</h2>
            <span>FITNESS GOURMET</span>
          </div>
        </div>

        <nav className="menu">
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "menu-link active" : "menu-link"
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div>
            <strong>{admin?.nome || "Admin"}</strong>
            <p>Sistema Online</p>
          </div>

          <button className="logout-btn" onClick={logout}>
            <FaSignOutAlt />
            Sair
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="status">
            <span className="online"></span>
            Sistema Online
          </div>
        </header>

        <Link to="/pdv" className="sidebar-link">
  <ShoppingCart size={20} />
  <span>PDV</span>
</Link>

        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

export default AdminLayout;