export default function ClienteFormPJ({

    novoCliente,

    setNovoCliente

}){

    return (

        <div className="cliente-form-grid">

            <input

                placeholder="Razão Social"

                value={novoCliente.razaoSocial}

                onChange={(e)=>

                    setNovoCliente({

                        ...novoCliente,

                        razaoSocial:e.target.value

                    })

                }

            />

            <input

                placeholder="CNPJ"

                value={novoCliente.cnpj}

                onChange={(e)=>

                    setNovoCliente({

                        ...novoCliente,

                        cnpj:e.target.value

                    })

                }

            />

        </div>

    );

}