export default function ClienteFormPF({

    novoCliente,

    setNovoCliente

}){

    function atualizarCampo(campo, valor){

        setNovoCliente({

            ...novoCliente,

            [campo]:valor

        });

    }

    console.log("ClienteFormPF renderizado");

    return(

        <div className="cliente-form-grid">

            <input

                placeholder="Razão Social"

                value={novoCliente.razaoSocial}

                onChange={(e)=>

                    atualizarCampo(

                        "razaoSocial",

                        e.target.value

                    )

                }

            />

            <input

                placeholder="Nome Fantasia"

                value={novoCliente.nomeFantasia}

                onChange={(e)=>

                    atualizarCampo(

                        "nomeFantasia",

                        e.target.value

                    )

                }

            />

            <input

                placeholder="CNPJ"

                value={novoCliente.cnpj}

                onChange={(e)=>

                    atualizarCampo(

                        "cnpj",

                        e.target.value

                    )

                }

            />

            <input

                placeholder="Inscrição Estadual"

                value={novoCliente.inscricaoEstadual}

                onChange={(e)=>

                    atualizarCampo(

                        "inscricaoEstadual",

                        e.target.value

                    )

                }

            />

            <input

                placeholder="Inscrição Municipal"

                value={novoCliente.inscricaoMunicipal}

                onChange={(e)=>

                    atualizarCampo(

                        "inscricaoMunicipal",

                        e.target.value

                    )

                }

            />

            <select

                value={novoCliente.indicadorIe}

                onChange={(e)=>

                    atualizarCampo(

                        "indicadorIe",

                        Number(e.target.value)

                    )

                }

            >

                <option value={1}>

                    Contribuinte ICMS

                </option>

                <option value={2}>

                    Isento

                </option>

                <option value={9}>

                    Não contribuinte

                </option>

            </select>

        </div>

    );

}