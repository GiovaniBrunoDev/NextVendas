import { useEffect, useMemo, useState } from "react";
import { Barcode, CheckSquare, Printer, Search, Square, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";
import Ean13Barcode from "../components/Ean13Barcode";
import { useAuth } from "../contexts/AuthContext";

const formatCurrency = (valor) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor || 0));

export default function Etiquetas({ onNavigate }) {
  const { lojaAtual } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [selecionadas, setSelecionadas] = useState({});
  const [busca, setBusca] = useState("");
  const [mostrarPreco, setMostrarPreco] = useState(true);
  const [carregando, setCarregando] = useState(true);

  const carregar = async () => {
    try {
      setCarregando(true);
      await api.post("/estoque/codigos-barras/gerar");
      const { data } = await api.get("/produtos");
      setProdutos(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.error || "Não foi possível carregar as etiquetas.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const variacoes = useMemo(
    () =>
      produtos.flatMap((produto) =>
        (produto.variacoes || []).map((variacao) => ({
          ...variacao,
          produtoId: produto.id,
          produtoNome: produto.nome,
          marca: produto.marca,
          preco: produto.preco,
          imagemUrl: produto.imagemUrl,
        }))
      ),
    [produtos]
  );

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return variacoes
      .filter((item) =>
        [item.produtoNome, item.marca, item.numeracao, item.codigoBarras]
          .filter(Boolean)
          .some((valor) => String(valor).toLowerCase().includes(termo))
      )
      .sort((a, b) => a.produtoNome.localeCompare(b.produtoNome) || String(a.numeracao).localeCompare(String(b.numeracao)));
  }, [variacoes, busca]);

  const etiquetas = useMemo(
    () =>
      variacoes.flatMap((item) =>
        Array.from({ length: Number(selecionadas[item.id] || 0) }, (_, copia) => ({
          ...item,
          copia,
        }))
      ),
    [variacoes, selecionadas]
  );

  const selecionarVisiveis = () => {
    setSelecionadas((atual) => {
      const proximo = { ...atual };
      filtradas.forEach((item) => {
        proximo[item.id] = Math.max(1, Number(proximo[item.id] || 0));
      });
      return proximo;
    });
  };

  const imprimir = () => {
    if (!etiquetas.length) {
      toast.info("Selecione ao menos uma numeração para imprimir.");
      return;
    }
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <style>{`
        @media print {
          @page { size: A4; margin: 8mm; }
          body * { visibility: hidden !important; }
          .etiquetas-impressao, .etiquetas-impressao * { visibility: visible !important; }
          .etiquetas-impressao {
            position: absolute !important;
            inset: 0 !important;
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 3mm !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .etiqueta-impressa {
            break-inside: avoid;
            width: 62mm !important;
            height: 32mm !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <header className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#16A34A]">
            <Barcode size={17} /> Estoque
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Etiquetas e códigos de barras</h1>
          <p className="mt-1 text-sm text-slate-500">Selecione as numerações e defina quantas etiquetas serão impressas.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => onNavigate?.("estoque")} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Voltar ao estoque
          </button>
          <button type="button" onClick={imprimir} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B1115] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#18232A]">
            <Printer size={17} /> Imprimir {etiquetas.length || ""}
          </button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar produto, marca, numeração ou código"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-base outline-none focus:border-[#16A34A] focus:bg-white sm:text-sm"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={selecionarVisiveis} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <CheckSquare size={16} /> Selecionar resultados
              </button>
              <button onClick={() => setSelecionadas({})} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <Trash2 size={16} /> Limpar seleção
              </button>
            </div>
          </div>

          {carregando ? (
            <p className="p-6 text-sm text-slate-500">Preparando códigos de barras...</p>
          ) : (
            <div className="max-h-[680px] divide-y divide-slate-100 overflow-auto">
              {filtradas.map((item) => {
                const copias = Number(selecionadas[item.id] || 0);
                return (
                  <div key={item.id} className={`grid gap-3 p-4 transition sm:grid-cols-[auto_minmax(0,1fr)_130px] sm:items-center ${copias ? "bg-emerald-50/50" : "hover:bg-slate-50"}`}>
                    <button
                      type="button"
                      onClick={() => setSelecionadas((atual) => ({ ...atual, [item.id]: copias ? 0 : 1 }))}
                      className="text-[#16A34A]"
                      aria-label={copias ? "Remover etiqueta" : "Selecionar etiqueta"}
                    >
                      {copias ? <CheckSquare size={21} /> : <Square size={21} className="text-slate-300" />}
                    </button>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{item.produtoNome}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Tam. {item.numeracao} · Estoque {item.estoque} · {item.codigoBarras}
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      Cópias
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={copias}
                        onChange={(event) => setSelecionadas((atual) => ({ ...atual, [item.id]: Math.max(0, Number(event.target.value || 0)) }))}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-[#16A34A] sm:text-sm"
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-6 xl:self-start">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-950">Prévia de impressão</h2>
              <p className="mt-1 text-xs text-slate-500">{etiquetas.length} etiquetas selecionadas</p>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input type="checkbox" checked={mostrarPreco} onChange={(event) => setMostrarPreco(event.target.checked)} />
              Mostrar preço
            </label>
          </div>

          <div className="etiquetas-impressao mt-4 grid gap-3">
            {etiquetas.length ? (
              etiquetas.map((item) => (
                <article key={`${item.id}-${item.copia}`} className="etiqueta-impressa flex h-[128px] flex-col justify-between overflow-hidden rounded-lg border border-slate-300 bg-white p-3 text-[#0B1115]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold uppercase">{lojaAtual?.loja?.nome || "Lojia"}</p>
                      <p className="truncate text-[12px] font-semibold">{item.produtoNome}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[9px] uppercase text-slate-500">Tamanho</p>
                      <p className="text-xl font-black">{item.numeracao}</p>
                    </div>
                  </div>
                  <Ean13Barcode codigo={item.codigoBarras} className="h-[54px] w-full" />
                  <div className="flex items-end justify-between gap-2">
                    <p className="font-mono text-[9px] tracking-[0.12em]">{item.codigoBarras}</p>
                    {mostrarPreco && <p className="text-xs font-bold">{formatCurrency(item.preco)}</p>}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                Selecione numerações para visualizar as etiquetas.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
