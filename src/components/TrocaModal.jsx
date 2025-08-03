import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import api from "../services/api";
import { X } from "lucide-react";

export default function TrocaModal({ aberto, venda, aoFechar, aoConfirmarTroca }) {
  const [produtos, setProdutos] = useState([]);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [modoTroca, setModoTroca] = useState("mesmo"); // 'mesmo' ou 'outro'
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

  if (!venda) return null;

  const confirmar = () => {
    if (!itemSelecionado || !novaVariacao) return;
    aoConfirmarTroca({
      vendaId: venda.id,
      itemId: itemSelecionado.id,
      modoTroca,
      novoProdutoId: novoProduto?.id || itemSelecionado.variacaoProduto.produto.id,
      novaVariacaoId: novaVariacao.id,
    });
  };

  const variacoesDisponiveisMesmoProduto = () => {
    const produtoOriginal = produtos.find(
      (p) => p.id === itemSelecionado?.variacaoProduto.produto.id
    );
    if (!produtoOriginal) return [];
    return produtoOriginal.variacoes.filter(
      (v) =>
        v.id !== itemSelecionado.variacaoProduto.id &&
        v.estoque > 0
    );
  };

  const variacoesOutroProduto = () => {
    if (!novoProduto) return [];
    return novoProduto.variacoes.filter((v) => v.estoque > 0);
  };

  return (
    <Dialog open={aberto} onClose={aoFechar} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
            onClick={aoFechar}
          >
            <X size={20} />
          </button>

          <Dialog.Title className="text-lg font-bold mb-4">
            Troca de Produto - Venda #{venda.id}
          </Dialog.Title>

          {/* Passo 1: escolher item */}
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Selecione o item a trocar</h2>
            <ul className="space-y-2">
              {venda.itens.map((item) => (
                <li
                  key={item.id}
                  className={`p-3 border rounded cursor-pointer ${
                    itemSelecionado?.id === item.id
                      ? "bg-blue-100 border-blue-400"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => setItemSelecionado(item)}
                >
                  {item.variacaoProduto.produto.nome} - {item.variacaoProduto.numeracao} ({item.quantidade}x)
                </li>
              ))}
            </ul>
          </div>

          {itemSelecionado && (
            <>
              {/* Passo 2: modo troca */}
              <div className="mb-6">
                <h2 className="font-semibold mb-2">Tipo de troca</h2>
                <div className="flex gap-4">
                  <label>
                    <input
                      type="radio"
                      checked={modoTroca === "mesmo"}
                      onChange={() => {
                        setModoTroca("mesmo");
                        setNovoProduto(null);
                        setNovaVariacao(null);
                      }}
                    />{" "}
                    Mesma peça (trocar numeração)
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={modoTroca === "outro"}
                      onChange={() => {
                        setModoTroca("outro");
                        setNovaVariacao(null);
                      }}
                    />{" "}
                    Outro produto
                  </label>
                </div>
              </div>

              {/* Passo 3: selecionar nova variação */}
              {modoTroca === "mesmo" ? (
                <div className="mb-6">
                  <h2 className="font-semibold mb-2">Selecione nova numeração</h2>
                  <select
                    className="w-full border p-2 rounded"
                    value={novaVariacao?.id || ""}
                    onChange={(e) =>
                      setNovaVariacao(
                        variacoesDisponiveisMesmoProduto().find(
                          (v) => v.id === parseInt(e.target.value)
                        )
                      )
                    }
                  >
                    <option value="">Selecione...</option>
                    {variacoesDisponiveisMesmoProduto().map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.numeracao} - Estoque: {v.estoque}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <h2 className="font-semibold mb-2">Selecione outro produto</h2>
                    <select
                      className="w-full border p-2 rounded"
                      value={novoProduto?.id || ""}
                      onChange={(e) => {
                        const prod = produtos.find(
                          (p) => p.id === parseInt(e.target.value)
                        );
                        setNovoProduto(prod);
                        setNovaVariacao(null);
                      }}
                    >
                      <option value="">Selecione...</option>
                      {produtos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  {novoProduto && (
                    <div className="mb-6">
                      <h2 className="font-semibold mb-2">Selecione variação</h2>
                      <select
                        className="w-full border p-2 rounded"
                        value={novaVariacao?.id || ""}
                        onChange={(e) =>
                          setNovaVariacao(
                            variacoesOutroProduto().find(
                              (v) => v.id === parseInt(e.target.value)
                            )
                          )
                        }
                      >
                        <option value="">Selecione...</option>
                        {variacoesOutroProduto().map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.numeracao} - Estoque: {v.estoque}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={aoFechar}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={!novaVariacao}
              onClick={confirmar}
            >
              Confirmar Troca
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
