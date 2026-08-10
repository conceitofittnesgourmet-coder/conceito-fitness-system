import { consultarCNPJ } from "../../services/external";

export default function ClienteFormPJ({

    novoCliente,

    setNovoCliente

}){

async function buscarCNPJ(cnpj) {

    try {

        const empresa = await consultarCNPJ(cnpj);

        setNovoCliente((anterior) => ({

            ...anterior,

            razaoSocial:
                empresa.razao_social || anterior.razaoSocial,

            nomeFantasia:
                empresa.nome_fantasia || anterior.nomeFantasia,

            cnpj: anterior.cnpj,

            endereco: {

                ...anterior.endereco,

                cep: empresa.cep || anterior.endereco.cep,

                logradouro: empresa.logradouro || anterior.endereco.logradouro,

                numero: empresa.numero || anterior.endereco.numero,

                bairro: empresa.bairro || anterior.endereco.bairro,

                cidade: empresa.municipio || anterior.endereco.cidade,

                uf: empresa.uf || anterior.endereco.uf,

                codigoMunicipioIbge:
                    empresa.codigo_ibge || anterior.endereco.codigoMunicipioIbge

            }

        }));

    } catch (error) {

        console.error(error);

    }

}

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

    onChange={(e) =>

        setNovoCliente({

            ...novoCliente,

            cnpj: e.target.value

        })

    }

    onBlur={(e) => {

        const numero = e.target.value.replace(/\D/g, "");

        if (numero.length === 14) {

            buscarCNPJ(numero);

        }

    }}

/>

        </div>

    );

}