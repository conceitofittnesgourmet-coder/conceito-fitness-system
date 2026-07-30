import { useEffect, useMemo, useState } from "react";
import { Crown, Gift, Save, Search, Sparkles, WalletCards } from "lucide-react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import "../styles/clube-conceito.css";

const dinheiro = (v) => Number(v || 0).toLocaleString("pt-BR", {style:"currency",currency:"BRL"});
export default function ClubeConceito(){
 const [dados,setDados]=useState(null),[busca,setBusca]=useState(""),[salvando,setSalvando]=useState(false),[msg,setMsg]=useState("");
 async function carregar(){ const r=await api.get("/clube/painel"); setDados(r.data); }
 useEffect(()=>{carregar().catch(()=>setMsg("Não foi possível carregar o Clube Conceito."));},[]);
 const membros=useMemo(()=> (dados?.membros||[]).filter(m=>`${m.cliente.nome} ${m.cliente.telefone} ${m.cliente.numeroAssociado}`.toLowerCase().includes(busca.toLowerCase())),[dados,busca]);
 function atualizarNivel(i,campo,valor){ setDados(d=>({...d,configuracao:{...d.configuracao,niveis:d.configuracao.niveis.map((n,x)=>x===i?{...n,[campo]:campo==='nome'?valor:Number(valor)}:n)}})); }
 async function salvar(){setSalvando(true);setMsg("");try{await api.put("/clube/configuracao",dados.configuracao);setMsg("Configuração salva com sucesso.");await carregar();}catch(e){setMsg(e.response?.data?.message||"Erro ao salvar.");}finally{setSalvando(false)}}
 return <AdminLayout title="Clube Conceito" subtitle="Fidelidade, carteira digital, níveis e benefícios">
  <div className="cc-page">
   <header className="cc-hero"><div><span><Sparkles size={16}/> Fidelidade premium</span><h1>Clube Conceito</h1><p>Transforme cada compra em relacionamento, benefícios e novas experiências.</p></div><button onClick={salvar} disabled={salvando}><Save size={18}/>{salvando?"Salvando...":"Salvar regras"}</button></header>
   {msg&&<div className="cc-message">{msg}</div>}
   <section className="cc-kpis">
    <article><Crown/><span>Membros ativos</span><strong>{dados?.indicadores?.membros||0}</strong></article>
    <article><Sparkles/><span>Pontos em circulação</span><strong>{Math.round(dados?.indicadores?.pontosEmCirculacao||0)}</strong></article>
    <article><WalletCards/><span>Cashback disponível</span><strong>{dinheiro(dados?.indicadores?.cashbackEmCirculacao)}</strong></article>
    <article><Gift/><span>Gasto acumulado</span><strong>{dinheiro(dados?.indicadores?.gastoAcumulado)}</strong></article>
   </section>
   <section className="cc-panel"><div className="cc-title"><div><h2>Regras do programa</h2><p>Defina acúmulo e validade geral.</p></div></div>
    <div className="cc-settings"><label>Nome do programa<input value={dados?.configuracao?.nomePrograma||""} onChange={e=>setDados(d=>({...d,configuracao:{...d.configuracao,nomePrograma:e.target.value}}))}/></label><label>Pontos por R$ 1<input type="number" step="0.1" value={dados?.configuracao?.pontosPorReal??1} onChange={e=>setDados(d=>({...d,configuracao:{...d.configuracao,pontosPorReal:Number(e.target.value)}}))}/></label><label>Validade dos pontos (dias)<input type="number" value={dados?.configuracao?.validadePontosDias??365} onChange={e=>setDados(d=>({...d,configuracao:{...d.configuracao,validadePontosDias:Number(e.target.value)}}))}/></label></div>
   </section>
   <section className="cc-panel"><div className="cc-title"><div><h2>Níveis e benefícios</h2><p>Progressão pelo gasto acumulado do cliente.</p></div></div><div className="cc-levels">{(dados?.configuracao?.niveis||[]).map((n,i)=><article key={n.nome+i}><div className="cc-level-head"><Crown/><input value={n.nome} onChange={e=>atualizarNivel(i,'nome',e.target.value)}/></div><label>Gasto mínimo<input type="number" value={n.gastoMinimo} onChange={e=>atualizarNivel(i,'gastoMinimo',e.target.value)}/></label><label>Multiplicador de pontos<input type="number" step="0.05" value={n.multiplicadorPontos} onChange={e=>atualizarNivel(i,'multiplicadorPontos',e.target.value)}/></label><label>Cashback (%)<input type="number" step="0.1" value={n.cashbackPercentual} onChange={e=>atualizarNivel(i,'cashbackPercentual',e.target.value)}/></label></article>)}</div></section>
   <section className="cc-panel"><div className="cc-title"><div><h2>Carteiras digitais</h2><p>Visão consolidada dos membros.</p></div><div className="cc-search"><Search size={17}/><input placeholder="Buscar membro..." value={busca} onChange={e=>setBusca(e.target.value)}/></div></div><div className="cc-table-wrap"><table><thead><tr><th>Membro</th><th>Associado</th><th>Nível</th><th>Pontos</th><th>Cashback</th><th>Gasto</th></tr></thead><tbody>{membros.map(m=><tr key={m.cliente.id}><td><strong>{m.cliente.nome}</strong><small>{m.cliente.telefone}</small></td><td>{m.cliente.numeroAssociado}</td><td><span className="cc-badge">{m.nivel?.nome}</span></td><td>{Math.round(m.pontos)}</td><td>{dinheiro(m.cashback)}</td><td>{dinheiro(m.gastoAcumulado)}</td></tr>)}</tbody></table></div></section>
  </div>
 </AdminLayout>;
}
