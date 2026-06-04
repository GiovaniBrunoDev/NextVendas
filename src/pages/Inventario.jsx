import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Barcode, CheckCircle2, ClipboardCheck, Plus, Search, X } from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";

const formatDate = (valor) => (valor ? new Date(valor).toLocaleString("pt-BR") : "-");

function Status({ status }) {
  const estilos = {
    em_andamento: "border-amber-200 bg-amber-50 text-amber-700",
    finalizado: "border-emerald-200 bg-emerald-50 text-emerald-700",
    cancelado: "border-slate-200 bg-slate-50 text-slate-600",
  };
  const textos = { em_andamento: "Em andamento", finalizado: "Finalizado", cancelado: "Cancelado" };
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${estilos[status] || estilos.cancelado}`}>{textos[status] || status}</span>;
}

export default function Inventario({ onNavigate }) {
  const [inventarios, setInventarios] = useState([]);
  const [inventario, setInventario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [codigo, setCodigo] = useState("");
  const [novoAberto, setNovoAberto] = useState(false);
  const [nomeNovo, setNomeNovo] = useState("");
  const [finalizarAberto, setFinalizarAberto] = useState(false);
  const [zerarNaoContados, setZerarNaoContados] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const codigoRef = useRef(null);

  const carregarInventarios = async (selecionarId) => {
    try {
      setCarregando(true);
      const { data } = await api.get("/inventarios");
      const lista = Array.isArray(data) ? data : [];
      setInventarios(lista);
      const alvo = selecionarId || inventario?.id || lista.find((item) => item.status === "em_andamento")?.id || lista[0]?.id;
      if (alvo) {
        const detalhe = await api.get(`/inventarios/${alvo}`);
        setInventario(detalhe.data);
      } else {
        setInventario(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Não foi possível carregar os inventários.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarInventarios();
  }, []);

  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (inventario?.itens || []).filter((item) =>
      [item.produtoNome, item.numeracao, item.codigoBarras].filter(Boolean).some((valor) => String(valor).toLowerCase().includes(termo))
    );
  }, [inventario, busca]);

  const atualizarItemLocal = (itemAtualizado) => {
    setInventario((atual) => {
      if (!atual) return atual;
      const itens = atual.itens.map((item) => (item.id === itemAtualizado.id ? { ...item, ...itemAtualizado } : item));
      const conferidos = itens.filter((item) => item.quantidadeContada !== null);
      return {
        ...atual,
        itens,
        resumo: {
          total: itens.length,
          conferidos: conferidos.length,
          pendentes: itens.length - conferidos.length,
          divergencias: conferidos.filter((item) => item.quantidadeContada !== item.estoqueSistema).length,
        },
      };
    });
  };

  const registrarContagem = async ({ codigoBarras, variacaoProdutoId, quantidade, incrementar = false }) => {
    if (!inventario || inventario.status !== "em_andamento") return;
    try {
      const { data } = await api.patch(`/inventarios/${inventario.id}/contagem`, {
        codigoBarras,
        variacaoProdutoId,
        quantidade,
        incrementar,
      });
      atualizarItemLocal(data);
      return data;
    } catch (error) {
      toast.error(error.response?.data?.error || "Não foi possível registrar a contagem.");
      return null;
    }
  };

  const lerCodigo = async (event) => {
    event.preventDefault();
    const codigoLimpo = codigo.trim();
    if (!codigoLimpo) return;
    const item = await registrarContagem({ codigoBarras: codigoLimpo, quantidade: 1, incrementar: true });
    if (item) toast.success(`${item.produtoNome || "Item"} contado.`);
    setCodigo("");
    codigoRef.current?.focus();
  };

  const iniciar = async (event) => {
    event.preventDefault();
    try {
      setSalvando(true);
      const { data } = await api.post("/inventarios", { nome: nomeNovo });
      setNovoAberto(false);
      setNomeNovo("");
      await carregarInventarios(data.id);
      toast.success("Inventário iniciado.");
    } catch (error) {
      if (error.response?.data?.inventarioId) {
        await carregarInventarios(error.response.data.inventarioId);
      }
      toast.error(error.response?.data?.error || "Não foi possível iniciar o inventário.");
    } finally {
      setSalvando(false);
    }
  };

  const finalizar = async () => {
    try {
      setSalvando(true);
      const { data } = await api.post(`/inventarios/${inventario.id}/finalizar`, { zerarNaoContados });
      setInventario(data);
      setFinalizarAberto(false);
      await carregarInventarios(data.id);
      toast.success("Inventário finalizado e estoque ajustado.");
    } catch (error) {
      toast.error(error.response?.data?.error || "Não foi possível finalizar o inventário.");
    } finally {
      setSalvando(false);
    }
  };

  const cancelar = async () => {
    if (!window.confirm("Cancelar este inventário? Nenhum estoque será alterado.")) return;
    try {
      await api.post(`/inventarios/${inventario.id}/cancelar`);
      await carregarInventarios(inventario.id);
      toast.success("Inventário cancelado.");
    } catch (error) {
      toast.error(error.response?.data?.error || "Não foi possível cancelar o inventário.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <header className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#16A34A]"><ClipboardCheck size={17} /> Estoque</div>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Inventário</h1>
          <p className="mt-1 text-sm text-slate-500">Conte o estoque físico, encontre divergências e ajuste com histórico.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={() => onNavigate?.("estoque")} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Voltar ao estoque</button>
          <button onClick={() => setNovoAberto(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B1115] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#18232A]">
            <Plus size={17} /> Novo inventário
          </button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h2 className="font-semibold text-slate-950">Histórico</h2>
            <p className="mt-1 text-xs text-slate-500">{inventarios.length} inventários</p>
          </div>
          <div className="max-h-[680px] divide-y divide-slate-100 overflow-auto">
            {inventarios.map((item) => (
              <button key={item.id} onClick={() => carregarInventarios(item.id)} className={`w-full p-4 text-left transition ${inventario?.id === item.id ? "bg-slate-100" : "hover:bg-slate-50"}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-950">{item.nome}</p>
                  <Status status={item.status} />
                </div>
                <p className="mt-2 text-xs text-slate-500">{formatDate(item.iniciadoEm)}</p>
                <p className="mt-2 text-xs font-medium text-slate-600">{item.resumo?.conferidos || 0}/{item.resumo?.total || 0} conferidos</p>
              </button>
            ))}
            {!inventarios.length && !carregando && <p className="p-5 text-sm text-slate-500">Nenhum inventário iniciado.</p>}
          </div>
        </aside>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {!inventario ? (
            <div className="grid min-h-[520px] place-items-center p-8 text-center">
              <div>
                <ClipboardCheck className="mx-auto text-[#16A34A]" size={32} />
                <h2 className="mt-4 text-lg font-semibold text-slate-950">Comece um inventário</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Será criada uma lista com todas as numerações atuais para você conferir com segurança.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold text-slate-950">{inventario.nome}</h2>
                      <Status status={inventario.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Iniciado por {inventario.criadoPor?.nome || "Usuário"} em {formatDate(inventario.iniciadoEm)}</p>
                  </div>
                  {inventario.status === "em_andamento" && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button onClick={cancelar} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
                      <button onClick={() => setFinalizarAberto(true)} className="rounded-lg bg-[#16A34A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#15803D]">Finalizar inventário</button>
                    </div>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    ["Itens", inventario.resumo?.total || 0],
                    ["Conferidos", inventario.resumo?.conferidos || 0],
                    ["Pendentes", inventario.resumo?.pendentes || 0],
                    ["Divergências", inventario.resumo?.divergencias || 0],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
                      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
                    </div>
                  ))}
                </div>

                {inventario.status === "em_andamento" && (
                  <form onSubmit={lerCodigo} className="mt-4 rounded-lg border border-[#16A34A]/25 bg-emerald-50/60 p-3">
                    <label className="text-xs font-semibold uppercase text-emerald-800">Contar com leitor de código de barras</label>
                    <div className="relative mt-2">
                      <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-[#16A34A]" size={19} />
                      <input
                        ref={codigoRef}
                        value={codigo}
                        onChange={(event) => setCodigo(event.target.value)}
                        placeholder="Leia o código e pressione Enter"
                        className="w-full rounded-lg border border-emerald-200 bg-white py-3 pl-10 pr-3 text-base outline-none focus:border-[#16A34A]"
                      />
                    </div>
                  </form>
                )}

                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar produto, numeração ou código" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-base outline-none focus:border-[#16A34A] focus:bg-white sm:text-sm" />
                </div>
              </div>

              <div className="max-h-[680px] divide-y divide-slate-100 overflow-auto">
                {itensFiltrados.map((item) => {
                  const conferido = item.quantidadeContada !== null;
                  const diferenca = conferido ? item.quantidadeContada - item.estoqueSistema : null;
                  return (
                    <div key={item.id} className={`grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_100px_150px] sm:items-center ${diferenca ? "bg-amber-50/50" : ""}`}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {conferido ? <CheckCircle2 size={17} className="shrink-0 text-[#16A34A]" /> : <span className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />}
                          <p className="truncate text-sm font-semibold text-slate-950">{item.produtoNome}</p>
                        </div>
                        <p className="mt-1 pl-6 text-xs text-slate-500">Tam. {item.numeracao} · {item.codigoBarras}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-500">Sistema</p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">{item.estoqueSistema}</p>
                      </div>
                      <label>
                        <span className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
                          Contagem
                          {diferenca !== null && diferenca !== 0 && <span className="text-amber-700">{diferenca > 0 ? `+${diferenca}` : diferenca}</span>}
                        </span>
                        <input
                          type="number"
                          min="0"
                          disabled={inventario.status !== "em_andamento"}
                          value={item.quantidadeContada ?? ""}
                          onChange={(event) => atualizarItemLocal({ ...item, quantidadeContada: event.target.value === "" ? null : Number(event.target.value) })}
                          onBlur={(event) => {
                            if (event.target.value !== "") registrarContagem({ variacaoProdutoId: item.variacaoProdutoId, quantidade: Number(event.target.value) });
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base font-semibold text-slate-950 outline-none focus:border-[#16A34A] disabled:bg-slate-100 sm:text-sm"
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {novoAberto && (
        <div className="fixed inset-0 z-[1200] grid place-items-center bg-[#0B1115]/45 p-4 backdrop-blur-sm">
          <form onSubmit={iniciar} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="text-lg font-semibold text-slate-950">Novo inventário</h2><p className="mt-1 text-sm text-slate-500">O estoque atual será usado como referência.</p></div>
              <button type="button" onClick={() => setNovoAberto(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <label className="mt-5 block text-sm font-semibold text-slate-700">Nome do inventário
              <input autoFocus value={nomeNovo} onChange={(event) => setNomeNovo(event.target.value)} placeholder={`Inventário ${new Date().toLocaleDateString("pt-BR")}`} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 text-base outline-none focus:border-[#16A34A]" />
            </label>
            <button disabled={salvando} className="mt-5 w-full rounded-lg bg-[#0B1115] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{salvando ? "Iniciando..." : "Iniciar contagem"}</button>
          </form>
        </div>
      )}

      {finalizarAberto && (
        <div className="fixed inset-0 z-[1200] grid place-items-center bg-[#0B1115]/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><AlertTriangle size={20} /></div>
              <div><h2 className="text-lg font-semibold text-slate-950">Finalizar inventário</h2><p className="mt-1 text-sm leading-6 text-slate-500">Os itens conferidos serão aplicados ao estoque e cada diferença ficará registrada no histórico.</p></div>
            </div>
            <label className="mt-5 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <input type="checkbox" checked={zerarNaoContados} onChange={(event) => setZerarNaoContados(event.target.checked)} className="mt-1" />
              <span><span className="block text-sm font-semibold text-slate-950">Zerar itens não contados</span><span className="mt-1 block text-xs leading-5 text-slate-500">Use somente se todos os itens ausentes na contagem realmente representam estoque zero.</span></span>
            </label>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button onClick={() => setFinalizarAberto(false)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Continuar contando</button>
              <button disabled={salvando} onClick={finalizar} className="rounded-lg bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{salvando ? "Finalizando..." : "Confirmar e ajustar estoque"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
