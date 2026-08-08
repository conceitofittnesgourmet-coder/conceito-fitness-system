import AdminLayout from "../layouts/AdminLayout";

import FoodCoreHeader from "./food-core/components/layout/FoodCoreHeader";
import DashboardCards from "./food-core/components/dashboard/DashboardCards";
import ReceitaEditor from "./food-core/components/receita/ReceitaEditor";

export default function FoodCore() {
    return (
        <AdminLayout>
            <FoodCoreHeader />
            <DashboardCards />
            <ReceitaEditor />
        </AdminLayout>
    );
}