export default function ClienteEndereco({

    novoCliente,

    setNovoCliente

}){

    function atualizar(campo, valor){

        setNovoCliente({

            ...novoCliente,

            endereco:{

                ...novoCliente.endereco,

                [campo]:valor

            }

        });

    }

    return(

        <div className="cliente-form-grid">

            <input

                placeholder="CEP"

                value={novoCliente.endereco.cep}

                onChange={(e)=>

                    atualizar(

                        "cep",

                        e.target.value

                    )

                }

            />

            <input

                placeholder="Logradouro"

                value={novoCliente.endereco.logradouro}

                onChange={(e)=>

                    atualizar(

                        "logradouro",

                        e.target.value

                    )

                }

            />

            <input

                placeholder="Número"

                value={novoCliente.endereco.numero}

                onChange={(e)=>

                    atualizar(

                        "numero",

                        e.target.value

                    )

                }

            />

            <input

                placeholder="Complemento"

                value={novoCliente.endereco.complemento}

                onChange={(e)=>

                    atualizar(

                        "complemento",

                        e.target.value

                    )

                }

            />

            <input

                placeholder="Bairro"

                value={novoCliente.endereco.bairro}

                onChange={(e)=>

                    atualizar(

                        "bairro",

                        e.target.value

                    )

                }

            />

            <input

                placeholder="Cidade"

                value={novoCliente.endereco.cidade}

                onChange={(e)=>

                    atualizar(

                        "cidade",

                        e.target.value

                    )

                }

            />

            <input

                placeholder="UF"

                maxLength={2}

                value={novoCliente.endereco.uf}

                onChange={(e)=>

                    atualizar(

                        "uf",

                        e.target.value.toUpperCase()

                    )

                }

            />

            <input

                placeholder="Código IBGE"

                value={novoCliente.endereco.codigoMunicipioIbge}

                onChange={(e)=>

                    atualizar(

                        "codigoMunicipioIbge",

                        e.target.value

                    )

                }

            />

        </div>

    );

}