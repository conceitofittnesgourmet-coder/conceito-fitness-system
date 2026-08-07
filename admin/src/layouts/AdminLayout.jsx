import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { NavLink } from "react-router-dom";
import { FaLayerGroup } from "react-icons/fa";
import { FaUtensils } from "react-icons/fa";
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
FaIndustry,
FaClipboardList,
FaFileAlt,
FaFileInvoice,
FaTruckLoading,
FaGlobe,
FaTags,
FaList,
FaBuilding,
FaFileSignature,
FaGift,
FaSlidersH,
FaPlug,

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
{
  label: "Cardápio Online",
  path: "/cardapio-online-admin",
  icon: <FaGlobe />
},
    { label: "Painel", path: "/", icon: <FaChartLine /> },
    { label: "Produtos", path: "/produtos", icon: <FaBoxOpen /> },
    {
    label: "FoodCore",
    path: "/foodcore",
    icon: <FaUtensils />
},
    { label: "Cadastro Mestre", path: "/produtos/cadastro-mestre", icon: <FaClipboardList /> },
    { label: "Opções por Produto", path: "/produtos/personalizacoes", icon: <FaSlidersH /> },
    { label: "Integração iFood", path: "/integracoes/ifood", icon: <FaPlug /> },
    { label: "Ingredientes", path: "/ingredientes", icon: <FaIndustry /> },
    { label: "Categorias", path: "/categorias", icon: <FaTags /> },

  {
  label: "Grupos",
  path: "/admin/grupos-componentes",
  icon: <FaLayerGroup />,
},
{
  label: "Opções",
  path: "/admin/opcoes-componentes",
  icon: <FaList />,
},
    { label: "Pedidos", path: "/pedidos", icon: <FaReceipt /> },
    { label: "Cozinha", path: "/cozinha", icon: <FaUtensils /> },
    { label: "Entregador", path: "/entregador", icon: <FaTruck /> },
    { label: "Clientes", path: "/clientes", icon: <FaUsers /> },
    { label: "Orçamentos", path: "/orcamentos", icon: <FaFileSignature /> },
    { label: "Clube Conceito", path: "/clube-conceito", icon: <FaGift /> },
    { label: "Empresa", path: "/empresa", icon: <FaBuilding /> },
    { label: "Financeiro", path: "/financeiro", icon: <FaWallet /> },


    {
  label: "Ordens de Produção",
  path: "/producao/ordens",
  icon: <FaIndustry />
},

{
  label: "Produção",
  path: "/producao",
  icon: <FaIndustry />
},

{
  label: "Ficha Técnica",
  path: "/ficha-tecnica",
  icon: <FaClipboardList />
},

{
  label: "Compras",
  path: "/compras",
  icon: <FaTruckLoading />
},

    { label: "Caixa", path: "/caixa", icon: <FaWallet /> },
    { label: "Analytics", path: "/analytics", icon: <FaChartPie /> },
    { label: "Relatórios", path: "/relatorios", icon: <FaFileAlt /> },
    {
  label: "Fiscal",
  path: "/fiscal",
  icon: <FaFileInvoice />,
},
    {
  label: "Cadastro Fiscal",
  path: "/fiscal/produtos",
  icon: <FaClipboardList />,
},
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

        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

export default AdminLayout;
