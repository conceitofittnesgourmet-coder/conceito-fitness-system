import AdminLayout from "../layouts/AdminLayout";

import DashboardCards from "./foodcore/components/DashboardCards";
import ReceitasPendentes from "./foodcore/components/ReceitasPendentes";
import CMVResumo from "./foodcore/components/CMVResumo";
import ProdutosSemReceita from "./foodcore/components/ProdutosSemReceita";
import AlertasFoodCore from "./foodcore/components/AlertasFoodCore";
import UltimasReceitas from "./foodcore/components/UltimasReceitas";

export default function FoodCore() {
    return (
        <AdminLayout
            title="FoodCore Enterprise"
            subtitle="Gestão inteligente de produção"
        >
            <div className="foodcore-dashboard">

                <DashboardCards />

                <ReceitasPendentes />

                <CMVResumo />

                <ProdutosSemReceita />

                <AlertasFoodCore />

                <UltimasReceitas />

            </div>
        </AdminLayout>
    );
}