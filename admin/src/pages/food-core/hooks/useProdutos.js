import { useEffect, useState } from "react";
import api from "../../../services/api";

export default function useProdutos() {
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function carregar() {
            try {
                const response = await api.get("/produtos");
                setProdutos(response.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        carregar();
    }, []);

    return {
        produtos,
        loading
    };
}