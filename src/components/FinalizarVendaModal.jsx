import { useEffect, useState } from "react";
import api from "../services/api";
import { toast } from "react-toastify";
import { FaMoneyBillAlt, FaCreditCard, FaPercentage } from "react-icons/fa";
import { SiPix } from "react-icons/si";
import Select from "react-select";

export default function FinalizarVendaModal({ carrinho, aoFechar, aoFinalizar }) {
  const [formaPagamento, setFormaPagamento] = useState("dinheiro");
  const [tipoEntrega, setTipoEntrega] = useState("retirada");
  const [taxaEntrega, setTaxaEntrega] = useState("");
  const [entregador, setEntregador] = useState("");

  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");

  const [endereco, setEndereco] = useState("");
  const [editandoEndereco, setEditandoEndereco] = useState(false);

  const [desconto, setDesconto] = useState("");

  const totalProdutos = carrinho.reduce((s, item) => s + item.qtd * item.preco, 0);
  const totalComEntrega = tipoEntrega === "entrega" ? totalProdutos + Number(taxaEntrega || 0) : totalProdutos;
  const totalFinal = totalComEntrega - Number(desconto || 0);

  const opcoes = clientes.map((c) => ({
    value: c.id,
    label: `${c.nome} (${c.telefone})`,
  }));

  useEffect(() => {
    carregarClientes();
  }, []);

  async function carregarClientes() {
    try {
      const res = await api.get("/clientes");
      setClientes(res.data);
    } catch (err) {
      console.error("Erro ao carregar clientes", err);
    }
  }

  async function handleFinalizar() {
    try {
      let clienteId = null;

      if (clienteSelecionado && !isNaN(parseInt(clienteSelecionado))) {
        clienteId = parseInt(clienteSelecionado);
        if (endereco?.trim()) {
          await api.put(`/clientes/${clienteId}`, { endereco: endereco.trim() });
        }
      } else if (clienteNome.trim()) {
        const res = await api.post("/clientes", {
          nome: clienteNome.trim(),
          telefone: clienteTelefone.trim() || null,
          endereco: endereco.trim() || null,
        });
        clienteId = res.data.id;
      }

      const produtos = carrinho.map((item) => {
        if (!item.variacaoId) {
          throw new Error(`Produto "${item.nome}" não possui variação selecionada.`);
        }
        return {
          variacaoProdutoId: item.variacaoId,
          quantidade: item.qtd,
        };
      });

      await api.post("/vendas", {
        produtos,
        total: totalFinal,
        formaPagamento,
        tipoEntrega,
        taxaEntrega: tipoEntrega === "entrega" ? Number(taxaEntrega) : null,
        entregador: tipoEntrega === "entrega" ? entregador : null,
        clienteId: clienteId || null,
      });

      toast.success("Venda finalizada com sucesso!");
      aoFinalizar();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Erro ao finalizar venda.");
    }
  }

  function formatTelefone(value) {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1)$2")
      .replace(/(\d{5})(\d{4})$/, "$1-$2")
      .substring(0, 14);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center px-4 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl border border-gray-200 animate-fadeIn">
        <h2 className="text-2xl font-bold text-blue-700 mb-6 border-b pb-2">🧾 Finalizar Venda</h2>

        {/* Pagamento */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">Forma de Pagamento</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "pix", label: "Pix", icon: <SiPix /> },
              { value: "dinheiro", label: "Dinheiro", icon: <FaMoneyBillAlt /> },
              { value: "cartao", label: "Cartão", icon: <FaCreditCard /> },
            ].map((opcao) => (
              <button
                key={opcao.value}
                onClick={() => setFormaPagamento(opcao.value)}
                className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg border text-xs font-medium transition-all ${
                  formaPagamento === opcao.value
                    ? "bg-blue-100 border-blue-600 text-blue-800"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <div className="text-lg">{opcao.icon}</div>
                {opcao.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cliente */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">👤 Cliente</h3>
          {clienteSelecionado ? (
            <>
              <Select
                options={opcoes}
                value={opcoes.find((opt) => opt.value === clienteSelecionado)}
                onChange={(e) => setClienteSelecionado(e?.value || "")}
                placeholder="Buscar ou selecionar cliente..."
                isClearable
              />
              <p className="text-sm text-gray-500 mt-1">Cliente selecionado. Deseja cadastrar um novo?</p>
              <button
                onClick={() => {
                  setClienteSelecionado("");
                  setClienteNome("");
                  setClienteTelefone("");
                }}
                className="text-blue-600 hover:underline text-sm mt-1"
              >
                ➕ Cadastrar novo cliente
              </button>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                placeholder="Nome do novo cliente"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded-md placeholder:text-sm"
              />
              <input
                type="text"
                placeholder="Telefone (ex: (99)99999-9999)"
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(formatTelefone(e.target.value))}
                className="w-full border border-gray-300 p-2 rounded-md placeholder:text-sm"
              />
              {clientes.length > 0 && (
                <Select
                  options={opcoes}
                  onChange={(e) => {
                    const id = e?.value || "";
                    setClienteSelecionado(id);
                    if (id) {
                      const cliente = clientes.find((c) => c.id === id);
                      if (cliente) {
                        setEndereco(cliente.endereco || "");
                        setEditandoEndereco(false);
                      }
                    } else {
                      setEndereco("");
                    }
                  }}
                  placeholder="Selecionar cliente existente..."
                  isClearable
                />
              )}
            </div>
          )}
        </div>

        {/* Entrega */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">🚚 Tipo de Entrega</h3>
          <div className="flex gap-3">
            {[
              { label: "🏪 Retirada", value: "retirada" },
              { label: "🏍️ Entrega", value: "entrega" },
            ].map((opcao) => (
              <button
                key={opcao.value}
                onClick={() => setTipoEntrega(opcao.value)}
                className={`flex-1 py-3 px-4 rounded-lg border font-medium text-sm text-center transition ${
                  tipoEntrega === opcao.value
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {opcao.label}
              </button>
            ))}
          </div>

          {tipoEntrega === "entrega" && (
            <div className="mt-4 space-y-4 animate-fadeIn">
              <textarea
                rows={2}
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="📍 Endereço de entrega"
                className="w-full border border-gray-300 p-2 rounded-md text-sm"
              />
              <input
                type="number"
                placeholder="💰 Taxa de entrega (R$)"
                value={taxaEntrega}
                onChange={(e) => setTaxaEntrega(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded-md placeholder:text-sm"
              />
              <input
                type="text"
                placeholder="👤 Nome do entregador"
                value={entregador}
                onChange={(e) => setEntregador(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded-md placeholder:text-sm"
              />
            </div>
          )}
        </div>

        {/* Desconto */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FaPercentage /> Desconto (R$)
          </label>
          <input
            type="number"
            placeholder="Ex: 5.00"
            value={desconto}
            onChange={(e) => setDesconto(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded-md placeholder:text-sm mt-1"
          />
        </div>

        {/* Total */}
        <div className="flex justify-between items-center text-lg font-bold border-t pt-3">
          <span>Total:</span>
          <span className="text-green-600">R$ {totalFinal.toFixed(2)}</span>
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={aoFechar}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleFinalizar}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow transition active:scale-95"
          >
            Confirmar Venda
          </button>
        </div>
      </div>
    </div>
  );
}
