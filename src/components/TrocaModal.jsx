import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@headlessui/react";
import api from "../services/api";
import { RefreshCcw, X } from "lucide-react";
import useModalPresence from "../hooks/useModalPresence";

export default function TrocaModal({ aberto, venda, aoFechar, aoConfirmarTroca }) {
  useModalPresence(Boolean(aberto));

  const [produtos, setProdutos] = useState([]);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [modoTroca, setModoTroca] = useState("mesmo");
  const [novoProduto, setNovoProduto] = useState(null);
  const [novaVariacao, setNovaVariacao] = useState(null);

  useEffect(() => {
    if (aberto) {
      api.get("/produtos").then((res) => setProdutos(res.data));
      setItemSelecionado(null);
      setNovoProduto(null);
      setNovaVariacao(null);
      setModoTroca("mesmo");
    }
  }, [aberto]);

  const variacoesMesmoProduto = useMemo(() => {
    const produtoOriginal = produtos.find(
      (p) => p.id === itemSelecionado?.variacaoProduto?.produto?.id
    );
    if (!produtoOriginal || !itemSelecionado) return [];

    return produtoOriginal.variacoes
      .filter((v) => v.id !== itemSelecionado.variacaoProduto.id && v.estoque > 0)
      .sort((a, b) => Number(a.numeracao) - Number(b.numeracao));
  }, [produtos, itemSelecionado]);

  const variacoesOutroProduto = useMemo(() => {
    if (!novoProduto) return [];
    return novoProduto.variacoes
      .filter((v) => v.estoque > 0)
      .sort((a, b) => Number(a.numeracao) - Number(b.numeracao));
  }, [novoProduto]);

  if (!venda) return null;

  const itensTrocaveis = (venda.itens || []).filter((item) => item.variacaoProduto);

  const confirmar = () => {
    if (!itemSelecionado?.variacaoProduto || !novaVariacao) return;

    aoConfirmarTroca({
      vendaId: venda.id,
      itemId: itemSelecionado.id,
      modoTroca,
      novoProdutoId: novoProduto?.id || itemSelecionado.variacaoProduto.produto.id,
      novaVariacaoId: novaVariacao.id,
    });
  };

  return (
    <Dialog open={aberto} onClose={aoFechar} className="relative z-50">
      <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-3 sm:p-4">
        <Dialog.Panel className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
            <div>
              <Dialog.Title className="flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-950">
                <RefreshCcw size={20} /> Troca da venda #{venda.id}
              </Dialog.Title>
              <p className="mt-1 text-sm text-slate-500">
                Selecione o item vendido e a nova variação que entrará no lugar.
              </p>
            </div>
            <button
              className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              onClick={aoFechar}
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[75vh] overflow-y-auto p-5">
            <section>
              <h2 className="text-sm font-semibold text-slate-950">Item a trocar</h2>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {itensTrocaveis.map((item) => {
                  const ativo = itemSelecionado?.id === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`rounded-lg border p-3 text-left transition ${
                        ativo
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 text-slate-800 hover:bg-slate-50"
                      }`}
                      onClick={() => {
                        setItemSelecionado(item);
                        setNovaVariacao(null);
                        setNovoProduto(null);
                        setModoTroca("mesmo");
                      }}
                    >
                      <p className="text-sm font-semibold">{item.variacaoProduto.produto.nome}</p>
                      <p className={`mt-1 text-xs ${ativo ? "text-slate-200" : "text-slate-500"}`}>
                        Numeração {item.variacaoProduto.numeracao} • Quantidade {item.quantidade}
                      </p>
                    </button>
                  );
                })}
                {itensTrocaveis.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Esta venda possui apenas itens avulsos, sem troca vinculada ao estoque.
                  </div>
                )}
              </div>
            </section>

            {itemSelecionado && (
              <section className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-sm font-semibold text-slate-950">Tipo de troca</h2>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    { value: "mesmo", label: "Mesma peça", detail: "Trocar apenas a numeração" },
                    { value: "outro", label: "Outro produto", detail: "Escolher produto e numeração" },
                  ].map((opcao) => (
                    <button
                      key={opcao.value}
                      type="button"
                      onClick={() => {
                        setModoTroca(opcao.value);
                        setNovoProduto(null);
                        setNovaVariacao(null);
                      }}
                      className={`rounded-lg border p-3 text-left transition ${
                        modoTroca === opcao.value
                          ? "border-slate-900 bg-white text-slate-950 shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                      }`}
                    >
                      <p className="text-sm font-semibold">{opcao.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{opcao.detail}</p>
                    </button>
                  ))}
                </div>

                {modoTroca === "mesmo" ? (
                  <div className="mt-4">
                    <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Nova numeração
                    </label>
                    <select
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                      value={novaVariacao?.id || ""}
                      onChange={(e) =>
                        setNovaVariacao(
                          variacoesMesmoProduto.find((v) => v.id === parseInt(e.target.value))
                        )
                      }
                    >
                      <option value="">Selecione</option>
                      {variacoesMesmoProduto.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.numeracao} - Estoque: {v.estoque}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label>
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Produto
                      </span>
                      <select
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                        value={novoProduto?.id || ""}
                        onChange={(e) => {
                          const prod = produtos.find((p) => p.id === parseInt(e.target.value));
                          setNovoProduto(prod);
                          setNovaVariacao(null);
                        }}
                      >
                        <option value="">Selecione</option>
                        {produtos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Numeração
                      </span>
                      <select
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                        value={novaVariacao?.id || ""}
                        disabled={!novoProduto}
                        onChange={(e) =>
                          setNovaVariacao(
                            variacoesOutroProduto.find((v) => v.id === parseInt(e.target.value))
                          )
                        }
                      >
                        <option value="">Selecione</option>
                        {variacoesOutroProduto.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.numeracao} - Estoque: {v.estoque}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white p-5 sm:flex-row sm:justify-end">
            <button
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={aoFechar}
            >
              Cancelar
            </button>
            <button
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              disabled={!novaVariacao}
              onClick={confirmar}
            >
              Confirmar troca
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
