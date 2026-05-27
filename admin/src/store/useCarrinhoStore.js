import { create } from "zustand";

const useCarrinhoStore = create((set, get) => ({
  carrinho: [],

  adicionarProduto: (produto) =>
    set((state) => {
      const existe = state.carrinho.find(
        (item) => item._id === produto._id
      );

      if (existe) {
        return {
          carrinho: state.carrinho.map((item) =>
            item._id === produto._id
              ? {
                  ...item,
                  quantidade: item.quantidade + 1,
                }
              : item
          ),
        };
      }

      return {
        carrinho: [
          ...state.carrinho,
          {
            ...produto,
            quantidade: 1,
          },
        ],
      };
    }),

  aumentarQuantidade: (id) =>
    set((state) => ({
      carrinho: state.carrinho.map((item) =>
        item._id === id
          ? {
              ...item,
              quantidade: item.quantidade + 1,
            }
          : item
      ),
    })),

  diminuirQuantidade: (id) =>
    set((state) => ({
      carrinho: state.carrinho
        .map((item) =>
          item._id === id
            ? {
                ...item,
                quantidade: item.quantidade - 1,
              }
            : item
        )
        .filter((item) => item.quantidade > 0),
    })),

  removerProduto: (id) =>
    set((state) => ({
      carrinho: state.carrinho.filter((item) => item._id !== id),
    })),

  limparCarrinho: () =>
    set({
      carrinho: [],
    }),

  totalCarrinho: () => {
    const { carrinho } = get();

    return carrinho.reduce(
      (acc, item) =>
        acc + Number(item.preco || 0) * Number(item.quantidade || 1),
      0
    );
  },
}));

export default useCarrinhoStore;