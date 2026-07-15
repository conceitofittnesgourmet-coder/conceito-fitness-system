import {
  FaBarcode,
  FaFileInvoiceDollar,
  FaInfoCircle,
  FaPercentage,
  FaReceipt,
} from "react-icons/fa";

const ORIGENS_MERCADORIA = [
  ["0", "0 - Nacional"],
  ["1", "1 - Estrangeira: importação direta"],
  ["2", "2 - Estrangeira: adquirida no mercado interno"],
  ["3", "3 - Nacional com conteúdo de importação superior a 40%"],
  ["4", "4 - Nacional produzida conforme processos básicos"],
  ["5", "5 - Nacional com conteúdo de importação até 40%"],
  ["6", "6 - Estrangeira: importação direta sem similar nacional"],
  ["7", "7 - Estrangeira: mercado interno sem similar nacional"],
  ["8", "8 - Nacional com conteúdo de importação superior a 70%"],
];

const CSOSN_OPCOES = [
  ["", "Selecione"],
  ["101", "101 - Tributada com permissão de crédito"],
  ["102", "102 - Tributada sem permissão de crédito"],
  ["103", "103 - Isenção do ICMS no Simples Nacional"],
  ["201", "201 - Com crédito e ICMS-ST"],
  ["202", "202 - Sem crédito e ICMS-ST"],
  ["203", "203 - Isenção e ICMS-ST"],
  ["300", "300 - Imune"],
  ["400", "400 - Não tributada"],
  ["500", "500 - ICMS cobrado anteriormente por ST"],
  ["900", "900 - Outros"],
];

const CST_PIS_COFINS = [
  ["", "Selecione"],
  ["01", "01 - Operação tributável com alíquota básica"],
  ["02", "02 - Operação tributável com alíquota diferenciada"],
  ["04", "04 - Operação monofásica"],
  ["06", "06 - Operação com alíquota zero"],
  ["07", "07 - Operação isenta"],
  ["08", "08 - Operação sem incidência"],
  ["09", "09 - Operação com suspensão"],
  ["49", "49 - Outras operações de saída"],
  ["99", "99 - Outras operações"],
];

function somenteNumeros(valor, limite) {
  return String(valor || "")
    .replace(/\D/g, "")
    .slice(0, limite);
}

function Campo({
  label,
  descricao,
  children,
  obrigatorio = false,
}) {
  return (
    <div className="produto-fiscal-field">
      <label>
        {label}
        {obrigatorio && <span className="fiscal-obrigatorio"> *</span>}
      </label>

      {children}

      {descricao && <small>{descricao}</small>}
    </div>
  );
}

function ProdutoFiscal({
  dadosFiscais,
  setDadosFiscais,
}) {
  const dados = dadosFiscais || {};

  function alterar(campo, valor) {
    setDadosFiscais((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  const pendencias = [];

  if (somenteNumeros(dados.ncm, 8).length !== 8) {
    pendencias.push("NCM");
  }

  if (!dados.cfopInterno) {
    pendencias.push("CFOP interno");
  }

  if (!dados.origemMercadoria) {
    pendencias.push("origem da mercadoria");
  }

  if (!dados.csosn && !dados.cstIcms) {
    pendencias.push("CSOSN ou CST ICMS");
  }

  const completa = pendencias.length === 0;

  return (
    <div className="produto-aba-card produto-fiscal-page">
      <section
        className={`produto-fiscal-status ${
          completa ? "completo" : "incompleto"
        }`}
      >
        <div>
          <span>Situação fiscal</span>

          <h3>
            {completa
              ? "Cadastro fiscal básico completo"
              : "Cadastro fiscal incompleto"}
          </h3>

          <p>
            {completa
              ? "Os campos mínimos para a classificação fiscal foram preenchidos."
              : `Falta preencher: ${pendencias.join(", ")}.`}
          </p>
        </div>

        <strong>{completa ? "✓" : pendencias.length}</strong>
      </section>

      <div className="produto-fiscal-grid">
        <section className="produto-fiscal-card">
          <div className="produto-fiscal-title">
            <FaReceipt />

            <div>
              <h3>Classificação fiscal</h3>
              <p>NCM, CEST, origem e natureza da operação.</p>
            </div>
          </div>

          <div className="produto-fiscal-fields">
            <Campo
              label="NCM"
              obrigatorio
              descricao="Informe exatamente 8 números."
            >
              <input
                value={dados.ncm || ""}
                maxLength={8}
                inputMode="numeric"
                placeholder="Ex.: 21069090"
                onChange={(e) =>
                  alterar("ncm", somenteNumeros(e.target.value, 8))
                }
              />
            </Campo>

            <Campo
              label="CEST"
              descricao="Preencha quando aplicável ao produto."
            >
              <input
                value={dados.cest || ""}
                maxLength={7}
                inputMode="numeric"
                placeholder="7 números"
                onChange={(e) =>
                  alterar("cest", somenteNumeros(e.target.value, 7))
                }
              />
            </Campo>

            <Campo
              label="Origem da mercadoria"
              obrigatorio
            >
              <select
                value={dados.origemMercadoria ?? "0"}
                onChange={(e) =>
                  alterar("origemMercadoria", e.target.value)
                }
              >
                {ORIGENS_MERCADORIA.map(([valor, label]) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo label="Código de benefício fiscal">
              <input
                value={dados.codigoBeneficioFiscal || ""}
                placeholder="Quando aplicável"
                onChange={(e) =>
                  alterar(
                    "codigoBeneficioFiscal",
                    e.target.value.toUpperCase()
                  )
                }
              />
            </Campo>

            <Campo label="CFOP interno" obrigatorio>
              <input
                value={dados.cfopInterno || ""}
                maxLength={4}
                inputMode="numeric"
                placeholder="Ex.: 5102"
                onChange={(e) =>
                  alterar(
                    "cfopInterno",
                    somenteNumeros(e.target.value, 4)
                  )
                }
              />
            </Campo>

            <Campo label="CFOP interestadual">
              <input
                value={dados.cfopInterestadual || ""}
                maxLength={4}
                inputMode="numeric"
                placeholder="Ex.: 6102"
                onChange={(e) =>
                  alterar(
                    "cfopInterestadual",
                    somenteNumeros(e.target.value, 4)
                  )
                }
              />
            </Campo>
          </div>
        </section>

        <section className="produto-fiscal-card">
          <div className="produto-fiscal-title">
            <FaFileInvoiceDollar />

            <div>
              <h3>ICMS</h3>
              <p>Configuração do ICMS conforme o regime da empresa.</p>
            </div>
          </div>

          <div className="produto-fiscal-fields">
            <Campo
              label="CSOSN"
              descricao="Usado normalmente por empresas do Simples Nacional."
            >
              <select
                value={dados.csosn || ""}
                onChange={(e) => alterar("csosn", e.target.value)}
              >
                {CSOSN_OPCOES.map(([valor, label]) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo
              label="CST ICMS"
              descricao="Utilizado quando a tributação exigir CST."
            >
              <input
                value={dados.cstIcms || ""}
                maxLength={3}
                inputMode="numeric"
                placeholder="Ex.: 00, 40, 60"
                onChange={(e) =>
                  alterar(
                    "cstIcms",
                    somenteNumeros(e.target.value, 3)
                  )
                }
              />
            </Campo>

            <Campo label="Alíquota ICMS (%)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={dados.aliquotaIcms ?? ""}
                placeholder="0,00"
                onChange={(e) =>
                  alterar("aliquotaIcms", e.target.value)
                }
              />
            </Campo>

            <Campo label="Alíquota FCP (%)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={dados.aliquotaFcp ?? ""}
                placeholder="0,00"
                onChange={(e) =>
                  alterar("aliquotaFcp", e.target.value)
                }
              />
            </Campo>
          </div>
        </section>

        <section className="produto-fiscal-card">
          <div className="produto-fiscal-title">
            <FaPercentage />

            <div>
              <h3>PIS, COFINS e IPI</h3>
              <p>Códigos e alíquotas dos tributos federais.</p>
            </div>
          </div>

          <div className="produto-fiscal-fields">
            <Campo label="CST PIS">
              <select
                value={dados.cstPis || ""}
                onChange={(e) => alterar("cstPis", e.target.value)}
              >
                {CST_PIS_COFINS.map(([valor, label]) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo label="Alíquota PIS (%)">
              <input
                type="number"
                min="0"
                step="0.0001"
                value={dados.aliquotaPis ?? ""}
                placeholder="0,0000"
                onChange={(e) =>
                  alterar("aliquotaPis", e.target.value)
                }
              />
            </Campo>

            <Campo label="CST COFINS">
              <select
                value={dados.cstCofins || ""}
                onChange={(e) =>
                  alterar("cstCofins", e.target.value)
                }
              >
                {CST_PIS_COFINS.map(([valor, label]) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo label="Alíquota COFINS (%)">
              <input
                type="number"
                min="0"
                step="0.0001"
                value={dados.aliquotaCofins ?? ""}
                placeholder="0,0000"
                onChange={(e) =>
                  alterar("aliquotaCofins", e.target.value)
                }
              />
            </Campo>

            <Campo label="CST IPI">
              <input
                value={dados.cstIpi || ""}
                maxLength={2}
                inputMode="numeric"
                placeholder="Ex.: 99"
                onChange={(e) =>
                  alterar(
                    "cstIpi",
                    somenteNumeros(e.target.value, 2)
                  )
                }
              />
            </Campo>

            <Campo label="Alíquota IPI (%)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={dados.aliquotaIpi ?? ""}
                placeholder="0,00"
                onChange={(e) =>
                  alterar("aliquotaIpi", e.target.value)
                }
              />
            </Campo>
          </div>
        </section>

        <section className="produto-fiscal-card">
          <div className="produto-fiscal-title">
            <FaBarcode />

            <div>
              <h3>GTIN e unidades tributáveis</h3>
              <p>Identificação comercial utilizada no documento fiscal.</p>
            </div>
          </div>

          <div className="produto-fiscal-fields">
            <Campo label="GTIN / EAN comercial">
              <input
                value={dados.gtin || ""}
                maxLength={14}
                inputMode="numeric"
                placeholder="Deixe vazio quando não houver GTIN"
                onChange={(e) =>
                  alterar("gtin", somenteNumeros(e.target.value, 14))
                }
              />
            </Campo>

            <Campo label="GTIN tributável">
              <input
                value={dados.gtinTributavel || ""}
                maxLength={14}
                inputMode="numeric"
                placeholder="Deixe vazio quando não houver GTIN"
                onChange={(e) =>
                  alterar(
                    "gtinTributavel",
                    somenteNumeros(e.target.value, 14)
                  )
                }
              />
            </Campo>

            <Campo label="Unidade comercial">
              <select
                value={dados.unidadeComercial || "UN"}
                onChange={(e) =>
                  alterar("unidadeComercial", e.target.value)
                }
              >
                <option value="UN">UN</option>
                <option value="KG">KG</option>
                <option value="G">G</option>
                <option value="L">L</option>
                <option value="ML">ML</option>
                <option value="CX">CX</option>
                <option value="PCT">PCT</option>
              </select>
            </Campo>

            <Campo label="Unidade tributável">
              <select
                value={dados.unidadeTributavel || "UN"}
                onChange={(e) =>
                  alterar("unidadeTributavel", e.target.value)
                }
              >
                <option value="UN">UN</option>
                <option value="KG">KG</option>
                <option value="G">G</option>
                <option value="L">L</option>
                <option value="ML">ML</option>
                <option value="CX">CX</option>
                <option value="PCT">PCT</option>
              </select>
            </Campo>
          </div>
        </section>

        <section className="produto-fiscal-card produto-fiscal-reforma">
          <div className="produto-fiscal-title">
            <FaInfoCircle />

            <div>
              <h3>IBS e CBS</h3>
              <p>
                Campos preparados para os novos leiautes da Reforma
                Tributária.
              </p>
            </div>
          </div>

          <div className="produto-fiscal-fields">
            <Campo label="CST IBS/CBS">
              <input
                value={dados.cstIbsCbs || ""}
                maxLength={3}
                inputMode="numeric"
                placeholder="Código definido pela tabela oficial"
                onChange={(e) =>
                  alterar(
                    "cstIbsCbs",
                    somenteNumeros(e.target.value, 3)
                  )
                }
              />
            </Campo>

            <Campo label="Classificação tributária">
              <input
                value={dados.cClassTrib || ""}
                maxLength={6}
                inputMode="numeric"
                placeholder="cClassTrib"
                onChange={(e) =>
                  alterar(
                    "cClassTrib",
                    somenteNumeros(e.target.value, 6)
                  )
                }
              />
            </Campo>

            <Campo label="Alíquota IBS (%)">
              <input
                type="number"
                min="0"
                step="0.0001"
                value={dados.aliquotaIbs ?? ""}
                onChange={(e) =>
                  alterar("aliquotaIbs", e.target.value)
                }
              />
            </Campo>

            <Campo label="Alíquota CBS (%)">
              <input
                type="number"
                min="0"
                step="0.0001"
                value={dados.aliquotaCbs ?? ""}
                onChange={(e) =>
                  alterar("aliquotaCbs", e.target.value)
                }
              />
            </Campo>
          </div>

          <div className="produto-fiscal-alerta">
            <FaInfoCircle />

            <p>
              Os códigos e alíquotas devem ser definidos conforme a
              classificação do produto e orientação contábil.
            </p>
          </div>
        </section>
      </div>

      <section className="produto-fiscal-switches">
        <label>
          <div>
            <strong>Produto tributável</strong>
            <span>Inclui este produto no detalhamento fiscal da venda.</span>
          </div>

          <input
            type="checkbox"
            checked={dados.produtoTributavel !== false}
            onChange={(e) =>
              alterar("produtoTributavel", e.target.checked)
            }
          />
        </label>

        <label>
          <div>
            <strong>Emitir na NFC-e</strong>
            <span>Permite que o item seja incluído na NFC-e.</span>
          </div>

          <input
            type="checkbox"
            checked={dados.emitirNfce !== false}
            onChange={(e) =>
              alterar("emitirNfce", e.target.checked)
            }
          />
        </label>
      </section>
    </div>
  );
}

export default ProdutoFiscal;