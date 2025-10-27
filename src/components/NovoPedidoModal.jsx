import { useEffect, useState } from "react";
import api from "../services/api";
import { toast } from "react-toastify";
import { FaMoneyBillAlt, FaCreditCard, FaPercentage } from "react-icons/fa";
import { SiPix } from "react-icons/si";
import Select from "react-select";

export default function NovoPedidoModal({ carrinho, aoFechar, aoConfirmar }) {
    const [formaPagamento, setFormaPagamento] = useState("dinheiro");
    const [tipoEntrega, setTipoEntrega] = useState("retirada");
    const [taxaEntrega, setTaxaEntrega] = useState("");
    const [entregador, setEntregador] = useState("");

    const [clientes, setClientes] = useState([]);
    const [clienteSelecionado, setClienteSelecionado] = useState("");
    const [clienteNome, setClienteNome] = useState("");
    const [clienteTelefone, setClienteTelefone] = useState("");

    const [endereco, setEndereco] = useState("");
    const [desconto, setDesconto] = useState("");
    const [carregando, setCarregando] = useState(false);

    const totalProdutos = carrinho.reduce((s, item) => s + item.qtd * item.preco, 0);
    const totalComEntrega = tipoEntrega === "entrega" ? totalProdutos + Number(taxaEntrega || 0) : totalProdutos;
    const totalFinal = totalComEntrega - Number(desconto || 0);

    const opcoes = clientes.map((c) => ({ value: c.id, label: `${c.nome} (${c.telefone})` }));

    useEffect(() => {
        carregarClientes();
        const modal = document.getElementById("novo-pedido-modal");
        if (modal) modal.scrollTop = 0;

        const listener = (e) => {
            if (e.key === "Escape") aoFechar();
            if (e.key === "Enter") handleSalvarPedido();
        };
        window.addEventListener("keydown", listener);
        return () => window.removeEventListener("keydown", listener);
    }, []);

    async function carregarClientes() {
        try {
            const res = await api.get("/clientes");
            setClientes(res.data);
        } catch (err) {
            console.error("Erro ao carregar clientes", err);
        }
    }

    async function handleSalvarPedido() {
        try {
            setCarregando(true);

            let clienteId = null;

            // ✅ Criar ou atualizar cliente
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

            // ✅ Preparar itens com preço unitário e subtotal
            const produtos = carrinho.map((item) => {
                if (!item.variacaoId) throw new Error(`Produto "${item.nome}" não possui variação selecionada.`);
                if (!item.preco) throw new Error(`Produto "${item.nome}" não tem preço definido.`);
                return {
                    variacaoProdutoId: item.variacaoId,
                    quantidade: item.qtd,
                    precoUnitario: item.preco,
                    subtotal: item.qtd * item.preco,
                };
            });

            // ✅ Salvar pedido
            const resPedido = await api.post("/pedidos", {
                clienteId: clienteId || null,
                tipoEntrega,
                taxaEntrega: tipoEntrega === "entrega" ? Number(taxaEntrega) : 0,
                entregador: tipoEntrega === "entrega" ? entregador : null,
                formaPagamento,
                total: totalFinal,
                status: "agendado",
                itens: produtos,
            });

            toast.success("Pedido criado com sucesso!");

            // Atualiza o status corretamente
            if (window.confirm("Deseja confirmar a venda agora?")) {
                await api.put(`/pedidos/${resPedido.data.pedido.id}/status`, { status: "confirmado" });

                await api.post("/vendas", {
                    clienteId: clienteId || null,
                    tipoEntrega,
                    taxaEntrega: tipoEntrega === "entrega" ? Number(taxaEntrega) : 0,
                    entregador: tipoEntrega === "entrega" ? entregador : null,
                    formaPagamento,
                    total: totalFinal,
                    produtos,
                });

                toast.success("Venda confirmada com sucesso!");
            }


            aoConfirmar();
            aoFechar();
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Erro ao salvar pedido.");
        } finally {
            setCarregando(false);
        }
    }


    function formatTelefone(value) {
        return value.replace(/\D/g, "")
            .replace(/(\d{2})(\d)/, "($1)$2")
            .replace(/(\d{5})(\d{4})$/, "$1-$2")
            .substring(0, 14);
    }

    return (
        <div className="fixed inset-0 z-9999 bg-black bg-opacity-40 flex items-center justify-center px-2 backdrop-blur-sm">
            <div id="novo-pedido-modal" className="relative bg-white p-4 sm:p-6 rounded-2xl w-full max-w-md sm:max-w-lg shadow-xl border border-gray-200 animate-fadeIn overflow-y-auto max-h-[95vh]">
                <button onClick={aoFechar} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl">×</button>

                <h2 className="text-xl sm:text-2xl font-bold text-blue-700 mb-4 sm:mb-6 border-b pb-2">📝 Novo Pedido</h2>

                {/* Cliente */}
                <div className="mb-5">
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
                                placeholder="Telefone"
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
                                            if (cliente) setEndereco(cliente.endereco || "");
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
                <div className="mb-5">
                    <h3 className="font-semibold text-gray-700 mb-2">🚚 Tipo de Entrega</h3>
                    <div className="flex gap-3 flex-col sm:flex-row">
                        {[{ label: "🏪 Retirada", value: "retirada" }, { label: "🏍️ Entrega", value: "entrega" }].map((opcao) => (
                            <button
                                key={opcao.value}
                                onClick={() => setTipoEntrega(opcao.value)}
                                className={`flex-1 py-3 px-4 rounded-lg border font-medium text-sm text-center transition ${tipoEntrega === opcao.value
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

                {/* Pagamento */}
                <div className="mb-5">
                    <h3 className="font-semibold text-gray-700 mb-2">💰 Forma de Pagamento</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {[{ value: "pix", label: "Pix", icon: <SiPix /> },
                        { value: "dinheiro", label: "Dinheiro", icon: <FaMoneyBillAlt /> },
                        { value: "cartao", label: "Cartão", icon: <FaCreditCard /> }
                        ].map((opcao) => (
                            <button
                                key={opcao.value}
                                onClick={() => setFormaPagamento(opcao.value)}
                                className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg border text-xs font-medium transition-all ${formaPagamento === opcao.value
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

                {/* Desconto */}
                <div className="mb-5">
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

                {/* Total + Ações */}
                <div className="sticky bottom-0 bg-white pt-3 pb-5 mt-5 border-t">
                    <div className="flex justify-between items-center text-lg font-bold mb-3">
                        <span>Total:</span>
                        <span className="text-green-600">R$ {totalFinal.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <button
                            onClick={aoFechar}
                            className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSalvarPedido}
                            disabled={carregando}
                            className="w-full sm:w-auto px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow transition active:scale-95"
                        >
                            {carregando ? "Processando..." : "Salvar Pedido"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
