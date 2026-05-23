import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Download, PackageSearch, Search } from "lucide-react";

export default function BuscaProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const [numeracaoSelecionada, setNumeracaoSelecionada] = useState("");

  async function carregarProdutos() {
    try {
      setCarregando(true);
      setErroCarregamento(false);
      const res = await api.get("/produtos");
      setProdutos(res.data);
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
      setErroCarregamento(true);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  const todasNumeracoes = useMemo(
    () => [...new Set(produtos.flatMap((p) => p.variacoes.map((v) => v.numeracao)))].sort((a, b) => a - b),
    [produtos]
  );

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter(
      (p) => p.nome.toLowerCase().includes(termo) || (p.codigo && p.codigo.toLowerCase().includes(termo))
    );
  }, [busca, produtos]);

  async function baixarImagens() {
    if (!numeracaoSelecionada) {
      alert("Selecione uma numeracao primeiro.");
      return;
    }

    const zip = new JSZip();
    const produtosComVariacao = produtos.filter((p) =>
      p.variacoes.some((v) => v.numeracao === numeracaoSelecionada && v.estoque > 0)
    );

    if (produtosComVariacao.length === 0) {
      alert("Nenhum produto encontrado com essa numeracao em estoque.");
      return;
    }

    for (const produto of produtosComVariacao) {
      if (!produto.imagemUrl) continue;

      try {
        const res = await fetch(produto.imagemUrl);
        const blob = await res.blob();
        const nomeArquivo = `${produto.codigo || produto.id || "produto"}_${numeracaoSelecionada}.jpg`;
        zip.file(nomeArquivo, blob);
      } catch (err) {
        console.error(`Erro ao baixar ${produto.imagemUrl}:`, err);
      }
    }

    const conteudo = await zip.generateAsync({ type: "blob" });
    saveAs(conteudo, `imagens_variacao_${numeracaoSelecionada}.zip`);
  }

  if (carregando) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-r-slate-500 border-t-slate-700"></div>
        </div>
        <p className="mt-5 text-sm font-medium text-slate-600">Consultando produtos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-950">
            <PackageSearch size={22} className="text-slate-500" /> Consulta de produtos
          </h1>
          <p className="mt-1 text-sm text-slate-500">Busque produtos, veja numeracoes e baixe imagens por grade.</p>
        </div>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[1fr_180px_auto]">
            <label className="relative block">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite nome ou codigo"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
              />
            </label>

            <select
              value={numeracaoSelecionada}
              onChange={(e) => setNumeracaoSelecionada(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            >
              <option value="">Numeracao</option>
              {todasNumeracoes.map((num) => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>

            <button onClick={baixarImagens} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              <Download size={16} /> Baixar
            </button>
          </div>

          <div className="p-4">
            {erroCarregamento ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Nao foi possivel carregar os produtos.</div>
            ) : produtosFiltrados.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {produtosFiltrados.map((produto) => (
                  <article key={produto.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-3">
                      <img
                        src={produto.imagemUrl || "https://cdn-icons-png.flaticon.com/512/771/771543.png"}
                        alt={produto.nome}
                        className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-950">{produto.nome}</p>
                        <p className="text-xs text-slate-500">Codigo: {produto.codigo || "N/A"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {produto.variacoes
                        .slice()
                        .sort((a, b) => a.numeracao - b.numeracao)
                        .map((v) => (
                          <div
                            key={v.id}
                            className={`flex h-10 flex-col items-center justify-center rounded-lg border text-xs ${
                              v.estoque > 0
                                ? "border-slate-300 bg-white text-slate-700"
                                : "border-slate-200 bg-slate-50 text-slate-400 line-through"
                            }`}
                          >
                            <span className="font-medium">{v.numeracao}</span>
                            <span className="text-[11px]">{v.estoque} un.</span>
                          </div>
                        ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                <PackageSearch size={32} className="mb-3 text-slate-400" />
                <p className="text-sm font-medium text-slate-900">Nenhum produto encontrado</p>
                <p className="mt-1 text-sm text-slate-500">Ajuste a busca para ver resultados.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
