import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CalendarDays,
  CreditCard,
  Download,
  PackageCheck,
  PackageSearch,
  RefreshCw,
  Search,
  ShoppingBag,
  Trophy,
  UsersRound,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../services/api";

const periodos = [
  { value: "dia", label: "Hoje" },
  { value: "7dias", label: "7 dias" },
  { value: "mes", label: "Mês" },
  { value: "personalizado", label: "Personalizado" },
  { value: "tudo", label: "Tudo" },
];

const abas = [
  { value: "resumo", label: "Resumo", icon: BarChart3 },
  { value: "vendas", label: "Vendas", icon: ShoppingBag },
  { value: "produtos", label: "Produtos", icon: Trophy },
  { value: "clientes", label: "Clientes", icon: UsersRound },
  { value: "lucro", label: "Lucro", icon: Wallet },
  { value: "estoque", label: "Estoque", icon: Boxes },
];

const tiposMovimento = {
  reposicao: "Reposição",
  venda: "Venda",
  cancelamento_venda: "Cancelamento de venda",
  reserva_pedido: "Reserva de pedido",
  edicao_pedido_retorno: "Edição de pedido",
  edicao_pedido_reserva: "Nova reserva",
  cancelamento_pedido: "Cancelamento de pedido",
  troca_retorno: "Retorno de troca",
  troca_saida: "Saída de troca",
  ajuste_manual: "Ajuste manual",
  cadastro_produto: "Cadastro do produto",
  cadastro_variacao: "Cadastro de numeração",
};

const moeda = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));

const percentual = (valor) => `${Number(valor || 0).toFixed(1)}%`;

const numero = (valor, fallback = 0) => {
  const parsed = Number(valor ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const dataHora = (valor) => {
  if (!valor) return "-";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const dataCurta = (valor) => {
  if (!valor) return "-";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

const chaveDia = (valor) => {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";
  return data.toISOString().slice(0, 10);
};

const toDateInputValue = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const dataInicioDia = (value) => {
  if (!value) return null;
  const data = new Date(`${value}T00:00:00`);
  return Number.isNaN(data.getTime()) ? null : data;
};

const dataFimDia = (value) => {
  if (!value) return null;
  const data = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(data.getTime()) ? null : data;
};

function inicioPeriodo(periodo) {
  const hoje = new Date();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  if (periodo === "dia") return inicioHoje;
  if (periodo === "7dias") {
    const inicio = new Date(inicioHoje);
    inicio.setDate(inicio.getDate() - 6);
    return inicio;
  }
  if (periodo === "mes") return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  return null;
}

function estaNoPeriodo(valor, periodo, dataInicio, dataFim) {
  if (periodo === "tudo") return true;
  const data = new Date(valor);
  if (periodo === "personalizado") {
    const inicio = dataInicioDia(dataInicio);
    const fim = dataFimDia(dataFim);
    return !Number.isNaN(data.getTime()) && Boolean(inicio && fim) && data >= inicio && data <= fim;
  }
  const inicio = inicioPeriodo(periodo);
  return !Number.isNaN(data.getTime()) && (!inicio || data >= inicio);
}

function nomeItem(item) {
  return item.variacaoProduto?.produto?.nome || item.nomeManual || item.nome || "Item avulso";
}

function numeracaoItem(item) {
  return item.variacaoProduto?.numeracao || item.numeracaoManual || "";
}

function receitaItem(item) {
  const produto = item.variacaoProduto?.produto;
  const preco = numero(item.precoUnitario ?? produto?.preco);
  return preco * numero(item.quantidade);
}

function custoItem(item) {
  const produto = item.variacaoProduto?.produto;
  const custo = numero(item.custoUnitario ?? produto?.custoUnitario);
  const outros = numero(item.outrosCustos ?? produto?.outrosCustos);
  return (custo + outros) * numero(item.quantidade);
}

function lucroVenda(venda) {
  const desconto = numero(venda.desconto);
  const subtotalItens = (venda.itens || []).reduce((soma, item) => soma + receitaItem(item), 0);
  const subtotalProdutos = numero(venda.subtotalProdutos, subtotalItens);
  const receitaProdutos = Math.max(subtotalProdutos - desconto, 0);
  const custoProdutos = (venda.itens || []).reduce((soma, item) => soma + custoItem(item), 0);
  return receitaProdutos - custoProdutos;
}

function textoVendaItens(venda) {
  return (venda.itens || [])
    .map((item) => {
      const tamanho = numeracaoItem(item);
      return `${nomeItem(item)}${tamanho ? ` ${tamanho}` : ""} (${numero(item.quantidade)}x)`;
    })
    .join(", ");
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n;]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function exportCsv(nomeArquivo, rows) {
  if (!rows.length) {
    toast.info("Não há dados para exportar.");
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(";"),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(";")),
  ].join("\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Relatorios() {
  const [aba, setAba] = useState("resumo");
  const [periodo, setPeriodo] = useState("mes");
  const [dataInicio, setDataInicio] = useState(() => toDateInputValue(new Date()));
  const [dataFim, setDataFim] = useState(() => toDateInputValue(new Date()));
  const [busca, setBusca] = useState("");
  const [tipoMovimento, setTipoMovimento] = useState("todos");
  const [vendas, setVendas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [dadosLucro, setDadosLucro] = useState(null);
  const [carregandoBase, setCarregandoBase] = useState(true);
  const [carregandoLucro, setCarregandoLucro] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => {
    carregarBase();
  }, []);

  useEffect(() => {
    carregarLucro();
  }, [dataFim, dataInicio, periodo]);

  async function carregarBase() {
    try {
      setCarregandoBase(true);
      const respostas = await Promise.allSettled([
        api.get("/vendas"),
        api.get("/pedidos"),
        api.get("/clientes"),
        api.get("/produtos"),
        api.get("/estoque/movimentos", { params: { limite: 250 } }),
        api.get("/estoque/entradas", { params: { limite: 250 } }),
      ]);

      const [resVendas, resPedidos, resClientes, resProdutos, resMovimentos, resEntradas] = respostas;
      if (resVendas.status === "fulfilled") setVendas(Array.isArray(resVendas.value.data) ? resVendas.value.data : []);
      if (resPedidos.status === "fulfilled") setPedidos(Array.isArray(resPedidos.value.data) ? resPedidos.value.data : []);
      if (resClientes.status === "fulfilled") setClientes(Array.isArray(resClientes.value.data) ? resClientes.value.data : []);
      if (resProdutos.status === "fulfilled") setProdutos(Array.isArray(resProdutos.value.data) ? resProdutos.value.data : []);
      if (resMovimentos.status === "fulfilled") setMovimentos(Array.isArray(resMovimentos.value.data) ? resMovimentos.value.data : []);
      if (resEntradas.status === "fulfilled") setEntradas(Array.isArray(resEntradas.value.data) ? resEntradas.value.data : []);

      const falhas = respostas.filter((item) => item.status === "rejected").length;
      if (falhas) toast.warn("Alguns relatórios não carregaram. Os demais continuam disponíveis.");
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
      toast.error("Erro ao carregar relatórios.");
    } finally {
      setCarregandoBase(false);
    }
  }

  async function carregarLucro() {
    try {
      setCarregandoLucro(true);
      const params =
        periodo === "personalizado"
          ? { inicio: dataInicio, fim: dataFim }
          : { periodo };
      const { data } = await api.get("/relatorios/lucro", { params });
      setDadosLucro(data);
    } catch (error) {
      console.error("Erro ao carregar lucro bruto:", error);
      toast.error(error.response?.data?.error || "Erro ao carregar lucro bruto.");
    } finally {
      setCarregandoLucro(false);
    }
  }

  async function atualizarTudo() {
    setAtualizando(true);
    await Promise.all([carregarBase(), carregarLucro()]);
    setAtualizando(false);
  }

  const vendasPeriodo = useMemo(
    () => vendas.filter((venda) => estaNoPeriodo(venda.data, periodo, dataInicio, dataFim)),
    [dataFim, dataInicio, vendas, periodo]
  );

  const pedidosPeriodo = useMemo(
    () => pedidos.filter((pedido) => estaNoPeriodo(pedido.dataCriacao || pedido.dataEntrega, periodo, dataInicio, dataFim)),
    [dataFim, dataInicio, pedidos, periodo]
  );

  const movimentosPeriodo = useMemo(
    () => movimentos.filter((movimento) => estaNoPeriodo(movimento.criadoEm, periodo, dataInicio, dataFim)),
    [dataFim, dataInicio, movimentos, periodo]
  );

  const entradasPeriodo = useMemo(
    () => entradas.filter((entrada) => estaNoPeriodo(entrada.criadoEm, periodo, dataInicio, dataFim)),
    [dataFim, dataInicio, entradas, periodo]
  );

  const vendasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return vendasPeriodo;
    return vendasPeriodo.filter((venda) => {
      const texto = [
        venda.id,
        venda.cliente?.nome,
        venda.cliente?.telefone,
        venda.formaPagamento,
        textoVendaItens(venda),
      ].join(" ").toLowerCase();
      return texto.includes(termo);
    });
  }, [vendasPeriodo, busca]);

  const movimentosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return movimentosPeriodo.filter((movimento) => {
      if (tipoMovimento !== "todos" && movimento.tipo !== tipoMovimento) return false;
      if (!termo) return true;
      const texto = [
        movimento.variacaoProduto?.produto?.nome,
        movimento.variacaoProduto?.numeracao,
        tiposMovimento[movimento.tipo] || movimento.tipo,
        movimento.criadoPor?.nome,
      ].join(" ").toLowerCase();
      return texto.includes(termo);
    });
  }, [busca, movimentosPeriodo, tipoMovimento]);

  const resumo = useMemo(() => {
    const faturamento = vendasPeriodo.reduce((soma, venda) => soma + numero(venda.total), 0);
    const itensVendidos = vendasPeriodo.reduce(
      (soma, venda) => soma + (venda.itens || []).reduce((sub, item) => sub + numero(item.quantidade), 0),
      0
    );
    const descontos = vendasPeriodo.reduce((soma, venda) => soma + numero(venda.desconto), 0);
    const taxasEntrega = vendasPeriodo.reduce((soma, venda) => soma + numero(venda.taxaEntrega), 0);
    const lucro = vendasPeriodo.reduce((soma, venda) => soma + lucroVenda(venda), 0);
    const clientesAtendidos = new Set(vendasPeriodo.map((venda) => venda.clienteId).filter(Boolean)).size;
    const ticketMedio = vendasPeriodo.length ? faturamento / vendasPeriodo.length : 0;
    const margem = faturamento > 0 ? (lucro / faturamento) * 100 : 0;

    return {
      faturamento,
      vendas: vendasPeriodo.length,
      itensVendidos,
      descontos,
      taxasEntrega,
      lucro,
      margem,
      ticketMedio,
      clientesAtendidos,
      pedidosAtivos: pedidosPeriodo.length,
      clientes: clientes.length,
    };
  }, [vendasPeriodo, pedidosPeriodo, clientes]);

  const vendasPorDia = useMemo(() => {
    const mapa = vendasPeriodo.reduce((acc, venda) => {
      const chave = chaveDia(venda.data);
      if (!acc[chave]) acc[chave] = { dia: dataCurta(venda.data), faturamento: 0, vendas: 0, lucro: 0 };
      acc[chave].faturamento += numero(venda.total);
      acc[chave].vendas += 1;
      acc[chave].lucro += lucroVenda(venda);
      return acc;
    }, {});

    return Object.entries(mapa)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);
  }, [vendasPeriodo]);

  const rankingProdutos = useMemo(() => {
    const mapa = new Map();
    vendasPeriodo.forEach((venda) => {
      (venda.itens || []).forEach((item) => {
        const nome = nomeItem(item);
        const tamanho = numeracaoItem(item);
        const chave = `${nome}-${tamanho || "sem-grade"}`;
        const atual = mapa.get(chave) || { nome, tamanho, quantidade: 0, receita: 0, lucro: 0 };
        atual.quantidade += numero(item.quantidade);
        atual.receita += receitaItem(item);
        atual.lucro += receitaItem(item) - custoItem(item);
        mapa.set(chave, atual);
      });
    });

    return [...mapa.values()].sort((a, b) => b.quantidade - a.quantidade || b.receita - a.receita);
  }, [vendasPeriodo]);

  const rankingClientes = useMemo(() => {
    const mapa = new Map();
    vendasPeriodo.forEach((venda) => {
      if (!venda.cliente) return;
      const chave = venda.cliente.id || venda.cliente.nome;
      const atual = mapa.get(chave) || {
        nome: venda.cliente.nome,
        telefone: venda.cliente.telefone,
        compras: 0,
        valor: 0,
        ultimo: venda.data,
      };
      atual.compras += 1;
      atual.valor += numero(venda.total);
      if (new Date(venda.data) > new Date(atual.ultimo)) atual.ultimo = venda.data;
      mapa.set(chave, atual);
    });

    return [...mapa.values()].sort((a, b) => b.valor - a.valor || b.compras - a.compras);
  }, [vendasPeriodo]);

  const formasPagamento = useMemo(() => {
    const mapa = new Map();
    vendasPeriodo.forEach((venda) => {
      const forma = venda.formaPagamento || "Não informado";
      const atual = mapa.get(forma) || { forma, valor: 0, vendas: 0 };
      atual.valor += numero(venda.total);
      atual.vendas += 1;
      mapa.set(forma, atual);
    });
    return [...mapa.values()].sort((a, b) => b.valor - a.valor);
  }, [vendasPeriodo]);

  const estoqueResumo = useMemo(() => {
    const variacoes = produtos.flatMap((produto) =>
      (produto.variacoes || []).map((variacao) => ({
        produto: produto.nome,
        marca: produto.marca,
        genero: produto.genero,
        numeracao: variacao.numeracao,
        estoque: numero(variacao.estoque),
        preco: numero(produto.preco),
        custo: numero(produto.custoUnitario) + numero(produto.outrosCustos),
      }))
    );
    const pares = variacoes.reduce((soma, item) => soma + item.estoque, 0);
    const valor = variacoes.reduce((soma, item) => soma + item.estoque * item.preco, 0);
    const custo = variacoes.reduce((soma, item) => soma + item.estoque * item.custo, 0);
    const criticos = variacoes
      .filter((item) => item.estoque <= 2)
      .sort((a, b) => a.estoque - b.estoque || a.produto.localeCompare(b.produto));

    return {
      produtos: produtos.length,
      variacoes: variacoes.length,
      pares,
      valor,
      custo,
      criticos,
      entradas: movimentosPeriodo.filter((item) => numero(item.quantidade) > 0).reduce((soma, item) => soma + numero(item.quantidade), 0),
      saidas: movimentosPeriodo.filter((item) => numero(item.quantidade) < 0).reduce((soma, item) => soma + Math.abs(numero(item.quantidade)), 0),
      reposicoes: movimentosPeriodo.filter((item) => item.tipo === "reposicao").length || entradasPeriodo.length,
    };
  }, [produtos, movimentosPeriodo, entradasPeriodo]);

  const heroValor = aba === "estoque"
    ? estoqueResumo.pares
    : aba === "clientes"
      ? rankingClientes.length
      : aba === "produtos"
        ? rankingProdutos.length
        : aba === "lucro"
          ? moeda(dadosLucro?.resumo?.lucro ?? resumo.lucro)
          : moeda(resumo.faturamento);

  const periodoAtual = useMemo(() => {
    if (periodo === "personalizado") {
      const inicio = dataInicioDia(dataInicio)?.toLocaleDateString("pt-BR");
      const fim = dataFimDia(dataFim)?.toLocaleDateString("pt-BR");
      if (inicio && fim) return `${inicio} até ${fim}`;
      return "Período personalizado";
    }

    return periodos.find((item) => item.value === periodo)?.label || "Período";
  }, [dataFim, dataInicio, periodo]);

  const carregando = carregandoBase && !vendas.length && !produtos.length;

  function exportarAba() {
    const nome = `lojia-relatorio-${aba}.csv`;

    if (aba === "vendas" || aba === "resumo") {
      exportCsv(nome, vendasFiltradas.map((venda) => ({
        venda: venda.id,
        data: dataHora(venda.data),
        cliente: venda.cliente?.nome || "Sem cliente",
        telefone: venda.cliente?.telefone || "",
        pagamento: venda.formaPagamento || "",
        total: numero(venda.total),
        desconto: numero(venda.desconto),
        taxaEntrega: numero(venda.taxaEntrega),
        itens: textoVendaItens(venda),
      })));
      return;
    }

    if (aba === "produtos") {
      exportCsv(nome, rankingProdutos.map((item) => ({
        produto: item.nome,
        numeracao: item.tamanho || "",
        quantidade: item.quantidade,
        receita: item.receita,
        lucro: item.lucro,
      })));
      return;
    }

    if (aba === "clientes") {
      exportCsv(nome, rankingClientes.map((cliente) => ({
        cliente: cliente.nome,
        telefone: cliente.telefone || "",
        compras: cliente.compras,
        valor: cliente.valor,
        ultimoAtendimento: dataHora(cliente.ultimo),
      })));
      return;
    }

    if (aba === "lucro") {
      exportCsv(nome, (dadosLucro?.vendas || []).map((venda) => ({
        venda: venda.id,
        data: dataHora(venda.data),
        cliente: venda.cliente,
        receita: venda.receitaProdutos,
        custo: venda.custoProdutos,
        lucro: venda.lucro,
        margem: percentual(venda.margem),
      })));
      return;
    }

    exportCsv(nome, movimentosFiltrados.map((movimento) => ({
      data: dataHora(movimento.criadoEm),
      produto: movimento.variacaoProduto?.produto?.nome || "",
      numeracao: movimento.variacaoProduto?.numeracao || "",
      operacao: tiposMovimento[movimento.tipo] || movimento.tipo,
      quantidade: movimento.quantidade,
      saldoAnterior: movimento.saldoAnterior,
      saldoFinal: movimento.saldoFinal,
      usuario: movimento.criadoPor?.nome || "",
    })));
  }

  return (
    <div className="lojia-page min-h-screen p-4 sm:p-6">
      <div className="lojia-hero-panel mb-6 flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Relatórios</h1>
          <p className="mt-1 text-sm text-white/68">
            Leia a loja por vendas, produtos, clientes, lucro e estoque sem sair da tela.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.08] px-4 py-3">
          <p className="text-xs font-medium uppercase text-white/62">
            {(abas.find((item) => item.value === aba)?.label || "Resumo")} · {periodoAtual}
          </p>
          <p className="mt-1 text-3xl font-semibold text-white">{heroValor}</p>
        </div>
      </div>

      <section className="lojia-surface sticky top-0 z-10 mb-6 p-3 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {abas.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setAba(value)}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
                  aba === value ? "bg-[#0B1115] text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:text-slate-950"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {periodos.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPeriodo(item.value)}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                    periodo === item.value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {periodo === "personalizado" && (
              <div className="grid grid-cols-2 gap-2 lg:w-72">
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(event) => setDataInicio(event.target.value)}
                  className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-base text-slate-700 outline-none transition focus:border-slate-400 sm:text-sm"
                />
                <input
                  type="date"
                  value={dataFim}
                  onChange={(event) => setDataFim(event.target.value)}
                  className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-base text-slate-700 outline-none transition focus:border-slate-400 sm:text-sm"
                />
              </div>
            )}

            <div className="relative min-w-0 lg:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar no relatório"
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-base outline-none transition focus:border-slate-400 sm:text-sm"
              />
            </div>

            <button
              type="button"
              onClick={exportarAba}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Download size={16} /> CSV
            </button>
            <button
              type="button"
              onClick={atualizarTudo}
              disabled={atualizando}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#0B1115] px-3 text-sm font-semibold text-white transition hover:bg-[#131C22] disabled:opacity-60"
            >
              <RefreshCw size={16} className={atualizando ? "animate-spin" : ""} /> Atualizar
            </button>
          </div>
        </div>
      </section>

      {carregando ? (
        <LoadingCard texto="Organizando os relatórios..." />
      ) : (
        <>
          {aba === "resumo" && (
            <ResumoRelatorio
              resumo={resumo}
              vendasPorDia={vendasPorDia}
              formasPagamento={formasPagamento}
              rankingProdutos={rankingProdutos}
              rankingClientes={rankingClientes}
              estoqueResumo={estoqueResumo}
            />
          )}
          {aba === "vendas" && (
            <VendasRelatorio vendas={vendasFiltradas} resumo={resumo} formasPagamento={formasPagamento} vendasPorDia={vendasPorDia} />
          )}
          {aba === "produtos" && <ProdutosRelatorio ranking={rankingProdutos} estoqueResumo={estoqueResumo} />}
          {aba === "clientes" && <ClientesRelatorio ranking={rankingClientes} clientes={clientes} />}
          {aba === "lucro" && <LucroRelatorio dados={dadosLucro} carregando={carregandoLucro} />}
          {aba === "estoque" && (
            <EstoqueRelatorio
              movimentos={movimentosFiltrados}
              resumo={estoqueResumo}
              tipoMovimento={tipoMovimento}
              onTipoMovimento={setTipoMovimento}
            />
          )}
        </>
      )}
    </div>
  );
}

function ResumoRelatorio({ resumo, vendasPorDia, formasPagamento, rankingProdutos, rankingClientes, estoqueResumo }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Faturamento" value={moeda(resumo.faturamento)} icon={ShoppingBag} destaque />
        <StatCard label="Vendas" value={resumo.vendas} icon={PackageCheck} />
        <StatCard label="Ticket médio" value={moeda(resumo.ticketMedio)} icon={CreditCard} />
        <StatCard label="Lucro bruto" value={moeda(resumo.lucro)} icon={Wallet} />
        <StatCard label="Clientes atendidos" value={resumo.clientesAtendidos} icon={UsersRound} />
        <StatCard label="Pedidos ativos" value={resumo.pedidosAtivos} icon={CalendarDays} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <GraficoBarras titulo="Faturamento por dia" subtitulo="Vendas do período" data={vendasPorDia} dataKey="faturamento" formatter={moeda} />
        <PainelLista
          titulo="Mais vendidos"
          subtitulo="Por quantidade"
          vazio="Nenhum produto vendido no período."
          itens={rankingProdutos.slice(0, 6)}
          renderItem={(item, index) => (
            <LinhaRanking
              key={`${item.nome}-${item.tamanho || index}`}
              index={index}
              titulo={`${item.nome}${item.tamanho ? ` · ${item.tamanho}` : ""}`}
              detalhe={`${item.quantidade} itens vendidos`}
              valor={moeda(item.receita)}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <PainelLista
          titulo="Clientes do período"
          subtitulo="Maiores compras"
          vazio="Nenhum cliente identificado."
          itens={rankingClientes.slice(0, 5)}
          renderItem={(item, index) => (
            <LinhaRanking key={item.nome} index={index} titulo={item.nome} detalhe={`${item.compras} compra(s)`} valor={moeda(item.valor)} />
          )}
        />
        <PainelLista
          titulo="Pagamento"
          subtitulo="Formas mais usadas"
          vazio="Nenhuma venda no período."
          itens={formasPagamento.slice(0, 5)}
          renderItem={(item, index) => (
            <LinhaRanking key={item.forma} index={index} titulo={item.forma} detalhe={`${item.vendas} venda(s)`} valor={moeda(item.valor)} />
          )}
        />
        <PainelLista
          titulo="Atenção no estoque"
          subtitulo="Numerações com até 2 pares"
          vazio="Nenhum item crítico."
          itens={estoqueResumo.criticos.slice(0, 5)}
          renderItem={(item, index) => (
            <LinhaRanking key={`${item.produto}-${item.numeracao}`} index={index} titulo={`${item.produto} · ${item.numeracao}`} detalhe={item.marca || "Sem marca"} valor={`${item.estoque} par(es)`} />
          )}
        />
      </div>
    </div>
  );
}

function VendasRelatorio({ vendas, resumo, formasPagamento, vendasPorDia }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Vendas" value={resumo.vendas} icon={ShoppingBag} destaque />
        <StatCard label="Faturamento" value={moeda(resumo.faturamento)} icon={ArrowDownLeft} />
        <StatCard label="Itens" value={resumo.itensVendidos} icon={PackageSearch} />
        <StatCard label="Ticket médio" value={moeda(resumo.ticketMedio)} icon={CreditCard} />
        <StatCard label="Descontos" value={moeda(resumo.descontos)} icon={ArrowUpRight} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_340px]">
        <GraficoBarras titulo="Vendas por dia" subtitulo="Faturamento agrupado" data={vendasPorDia} dataKey="faturamento" formatter={moeda} />
        <PainelLista
          titulo="Formas de pagamento"
          subtitulo="Valor recebido por forma"
          vazio="Nenhuma venda no período."
          itens={formasPagamento}
          renderItem={(item, index) => (
            <LinhaRanking key={item.forma} index={index} titulo={item.forma} detalhe={`${item.vendas} venda(s)`} valor={moeda(item.valor)} />
          )}
        />
      </div>

      <TabelaVendas vendas={vendas} />
    </div>
  );
}

function ProdutosRelatorio({ ranking, estoqueResumo }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Produtos" value={estoqueResumo.produtos} icon={Boxes} destaque />
        <StatCard label="Variações" value={estoqueResumo.variacoes} icon={PackageSearch} />
        <StatCard label="Pares em estoque" value={estoqueResumo.pares} icon={PackageCheck} />
        <StatCard label="Valor em estoque" value={moeda(estoqueResumo.valor)} icon={ShoppingBag} />
        <StatCard label="Custo em estoque" value={moeda(estoqueResumo.custo)} icon={Wallet} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <RankingTable
          titulo="Ranking de produtos"
          subtitulo="Itens vendidos no período"
          headers={["Produto", "Qtd.", "Receita", "Lucro"]}
          rows={ranking.map((item) => [
            `${item.nome}${item.tamanho ? ` · ${item.tamanho}` : ""}`,
            item.quantidade,
            moeda(item.receita),
            moeda(item.lucro),
          ])}
          empty="Nenhum produto vendido neste período."
        />
        <RankingTable
          titulo="Estoque crítico"
          subtitulo="Numerações com até 2 pares"
          headers={["Produto", "Nº", "Estoque"]}
          rows={estoqueResumo.criticos.slice(0, 20).map((item) => [item.produto, item.numeracao, item.estoque])}
          empty="Nenhum item crítico."
        />
      </div>
    </div>
  );
}

function ClientesRelatorio({ ranking, clientes }) {
  const clientesSemTelefone = clientes.filter((cliente) => !cliente.telefone).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clientes cadastrados" value={clientes.length} icon={UsersRound} destaque />
        <StatCard label="Compraram no período" value={ranking.length} icon={ShoppingBag} />
        <StatCard label="Sem telefone" value={clientesSemTelefone} icon={AlertTriangle} />
        <StatCard label="Ticket por cliente" value={moeda(ranking.length ? ranking.reduce((soma, item) => soma + item.valor, 0) / ranking.length : 0)} icon={CreditCard} />
      </div>

      <RankingTable
        titulo="Ranking de clientes"
        subtitulo="Quem mais comprou no período"
        headers={["Cliente", "Telefone", "Compras", "Valor", "Última compra"]}
        rows={ranking.map((item) => [item.nome, item.telefone || "-", item.compras, moeda(item.valor), dataHora(item.ultimo)])}
        empty="Nenhum cliente com venda no período."
      />
    </div>
  );
}

function LucroRelatorio({ dados, carregando }) {
  const resumo = dados?.resumo || {};
  const vendas = dados?.vendas || [];

  if (carregando && !dados) {
    return <LoadingCard texto="Calculando lucro bruto..." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Lucro bruto" value={moeda(resumo.lucro)} icon={Wallet} destaque />
        <StatCard label="Receita produtos" value={moeda(resumo.receitaProdutos)} icon={ArrowDownLeft} />
        <StatCard label="Custo produtos" value={moeda(resumo.custoProdutos)} icon={ArrowUpRight} />
        <StatCard label="Margem" value={percentual(resumo.margem)} icon={BarChart3} />
        <StatCard label="Vendas analisadas" value={resumo.vendas || 0} icon={ShoppingBag} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <GraficoBarras titulo="Lucro por dia" subtitulo="Receita menos custo" data={dados?.porDia || []} dataKey="lucro" formatter={moeda} />
        <section className="lojia-surface p-5">
          <h2 className="text-base font-semibold text-slate-950">Composição</h2>
          <div className="mt-4 space-y-3 text-sm">
            <LinhaResumo label="Faturamento total" value={moeda(resumo.faturamento)} />
            <LinhaResumo label="Subtotal produtos" value={moeda(resumo.subtotalProdutos)} />
            <LinhaResumo label="Descontos" value={`- ${moeda(resumo.descontos)}`} />
            <LinhaResumo label="Taxas de entrega" value={moeda(resumo.taxasEntrega)} />
            <LinhaResumo label="Custo mercadorias" value={`- ${moeda(resumo.custoProdutos)}`} />
            <div className="border-t border-slate-200 pt-3">
              <LinhaResumo label="Lucro bruto" value={moeda(resumo.lucro)} strong />
              <LinhaResumo label="Margem" value={percentual(resumo.margem)} strong />
            </div>
          </div>
        </section>
      </div>

      <RankingTable
        titulo="Vendas no cálculo"
        subtitulo="Detalhamento do lucro bruto"
        headers={["Venda", "Data", "Cliente", "Receita", "Custo", "Lucro", "Margem"]}
        rows={vendas.map((venda) => [
          `#${venda.id}`,
          dataHora(venda.data),
          venda.cliente,
          moeda(venda.receitaProdutos),
          moeda(venda.custoProdutos),
          moeda(venda.lucro),
          percentual(venda.margem),
        ])}
        empty="Nenhuma venda encontrada neste período."
      />
    </div>
  );
}

function EstoqueRelatorio({ movimentos, resumo, tipoMovimento, onTipoMovimento }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Movimentos" value={movimentos.length} icon={PackageSearch} destaque />
        <StatCard label="Entradas" value={resumo.entradas} icon={ArrowDownLeft} />
        <StatCard label="Saídas" value={resumo.saidas} icon={ArrowUpRight} />
        <StatCard label="Reposições" value={resumo.reposicoes} icon={Boxes} />
        <StatCard label="Críticos" value={resumo.criticos.length} icon={AlertTriangle} />
      </div>

      <section className="lojia-surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Histórico de estoque</h2>
            <p className="text-sm text-slate-500">Entradas, reservas, vendas, cancelamentos e ajustes recentes.</p>
          </div>
          <select
            value={tipoMovimento}
            onChange={(event) => onTipoMovimento(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-base outline-none focus:border-slate-400 sm:text-sm"
          >
            <option value="todos">Todos os movimentos</option>
            {Object.entries(tiposMovimento).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Numeração</th>
                <th className="px-4 py-3">Operação</th>
                <th className="px-4 py-3">Movimento</th>
                <th className="px-4 py-3">Saldo</th>
                <th className="px-4 py-3">Usuário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movimentos.map((movimento) => (
                <tr key={movimento.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{dataHora(movimento.criadoEm)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{movimento.variacaoProduto?.produto?.nome || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{movimento.variacaoProduto?.numeracao || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{tiposMovimento[movimento.tipo] || movimento.tipo}</td>
                  <td className={`px-4 py-3 font-semibold ${numero(movimento.quantidade) >= 0 ? "text-slate-950" : "text-rose-700"}`}>
                    {numero(movimento.quantidade) >= 0 ? "+" : ""}
                    {movimento.quantidade}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{movimento.saldoAnterior} -&gt; {movimento.saldoFinal}</td>
                  <td className="px-4 py-3 text-slate-700">{movimento.criadoPor?.nome || "-"}</td>
                </tr>
              ))}
              {movimentos.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-slate-500">Nenhuma movimentação encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function TabelaVendas({ vendas }) {
  return (
    <RankingTable
      titulo="Vendas do período"
      subtitulo="Clique no menu Vendas para editar ou imprimir recibos"
      headers={["Venda", "Data", "Cliente", "Pagamento", "Total", "Itens"]}
      rows={vendas.map((venda) => [
        `#${venda.id}`,
        dataHora(venda.data),
        venda.cliente?.nome || "Sem cliente",
        venda.formaPagamento || "-",
        moeda(venda.total),
        textoVendaItens(venda),
      ])}
      empty="Nenhuma venda encontrada."
    />
  );
}

function GraficoBarras({ titulo, subtitulo, data, dataKey, formatter }) {
  return (
    <section className="lojia-surface p-5">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{titulo}</h2>
          <p className="text-sm text-slate-500">{subtitulo}</p>
        </div>
      </div>

      {data.length ? (
        <ResponsiveContainer width="100%" height={286}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} />
            <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${Math.round(value)}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                color: "#0B1115",
                fontSize: "12px",
              }}
              formatter={(value) => formatter(value)}
            />
            <Bar dataKey={dataKey} fill="#0B1115" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[286px] items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500">
          Sem dados para o período.
        </div>
      )}
    </section>
  );
}

function PainelLista({ titulo, subtitulo, itens, renderItem, vazio }) {
  return (
    <section className="lojia-surface p-5">
      <h2 className="text-base font-semibold text-slate-950">{titulo}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>
      <div className="mt-4 space-y-2">
        {itens.length ? itens.map(renderItem) : <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">{vazio}</p>}
      </div>
    </section>
  );
}

function LinhaRanking({ index, titulo, detalhe, valor }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
          {index + 1}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">{titulo}</p>
          <p className="truncate text-xs text-slate-500">{detalhe}</p>
        </div>
      </div>
      <span className="shrink-0 text-sm font-semibold text-slate-950">{valor}</span>
    </div>
  );
}

function RankingTable({ titulo, subtitulo, headers, rows, empty }) {
  return (
    <section className="lojia-surface overflow-hidden">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-base font-semibold text-slate-950">{titulo}</h2>
        <p className="text-sm text-slate-500">{subtitulo}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className={`px-4 py-3 ${cellIndex === 0 ? "font-semibold text-slate-950" : "text-slate-700"}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-4 py-10 text-center text-slate-500">{empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatCard({ label, value, icon: Icon, destaque = false }) {
  return (
    <div className={`lojia-surface p-4 ${destaque ? "bg-[#0B1115] text-white" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`truncate text-xs font-medium uppercase ${destaque ? "text-white/65" : "text-slate-500"}`}>{label}</p>
          <p className={`mt-1.5 truncate text-xl font-semibold ${destaque ? "text-white" : "text-slate-950"}`}>{value}</p>
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${destaque ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function LinhaResumo({ label, value, strong = false }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${strong ? "font-semibold text-slate-950" : "text-slate-600"}`}>
      <span>{label}</span>
      <span className="shrink-0">{value}</span>
    </div>
  );
}

function LoadingCard({ texto }) {
  return (
    <div className="lojia-surface flex min-h-[320px] items-center justify-center p-8">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#0B1115]" />
        <p className="mt-4 text-sm font-medium text-slate-600">{texto}</p>
      </div>
    </div>
  );
}
