import { consultarCEP } from "../../services/external";

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

    async function buscarCEP(cep) {

    try {

        const endereco = await consultarCEP(cep);

        setNovoCliente({

            ...novoCliente,

            endereco: {

                ...novoCliente.endereco,

                ...endereco

            }

        });

    } catch (error) {

        console.error(error);

    }

}

    return(

        <div className="cliente-form-grid">

            <input

    placeholder="CEP"

    value={novoCliente.endereco.cep}

    onChange={(e) => {

        const valor = e.target.value;

        atualizar("cep", valor);

        const cep = valor.replace(/\D/g, "");

        if (cep.length === 8) {

            buscarCEP(cep);

        }

    }}

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