export default function ClienteFiscal({

    novoCliente,

    setNovoCliente

}){

    return(

        <div className="cliente-form-grid">

            <input

                placeholder="Telefone"

                value={novoCliente.telefone}

                onChange={(e)=>

                    setNovoCliente({

                        ...novoCliente,

                        telefone:e.target.value

                    })

                }

            />

            <input

                placeholder="WhatsApp"

                value={novoCliente.whatsapp}

                onChange={(e)=>

                    setNovoCliente({

                        ...novoCliente,

                        whatsapp:e.target.value

                    })

                }

            />

            <input

                placeholder="Email"

                value={novoCliente.email}

                onChange={(e)=>

                    setNovoCliente({

                        ...novoCliente,

                        email:e.target.value

                    })

                }

            />

            <textarea

                placeholder="Observações Fiscais"

                value={novoCliente.observacaoFiscal}

                onChange={(e)=>

                    setNovoCliente({

                        ...novoCliente,

                        observacaoFiscal:e.target.value

                    })

                }

            />

        </div>

    );

}