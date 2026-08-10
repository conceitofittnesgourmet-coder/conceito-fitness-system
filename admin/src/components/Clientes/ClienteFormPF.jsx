export default function ClienteFormPF({
  novoCliente,
  setNovoCliente
}) {

  function atualizarCampo(campo, valor) {
    setNovoCliente({
      ...novoCliente,
      [campo]: valor
    });
  }

  return (
    <div className="cliente-form-grid">

      <input
        placeholder="Nome Completo"
        value={novoCliente.nome}
        onChange={(e) =>
          atualizarCampo("nome", e.target.value)
        }
      />

      <input
        placeholder="CPF"
        value={novoCliente.cpf}
        onChange={(e) =>
          atualizarCampo("cpf", e.target.value)
        }
      />

      <input
        placeholder="Telefone"
        value={novoCliente.telefone}
        onChange={(e) =>
          atualizarCampo("telefone", e.target.value)
        }
      />

      <input
        placeholder="WhatsApp"
        value={novoCliente.whatsapp}
        onChange={(e) =>
          atualizarCampo("whatsapp", e.target.value)
        }
      />

      <input
        placeholder="E-mail"
        value={novoCliente.email}
        onChange={(e) =>
          atualizarCampo("email", e.target.value)
        }
      />

    </div>
  );
}