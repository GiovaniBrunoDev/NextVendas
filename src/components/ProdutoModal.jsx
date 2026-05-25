import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  PackagePlus,
  Plus,
  Save,
  Shirt,
  Tag,
  Truck,
  X,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import useModalPresence from "../hooks/useModalPresence";

const API_KEY = "6371650aa50b8af82e574e8022553613";

const etapas = [
  { key: "dados", label: "Dados", title: "Dados do produto" },
  { key: "midia", label: "Midia", title: "Midia do produto" },
  { key: "grade", label: "Grade", title: "Grade e estoque" },
  { key: "revisao", label: "Revisao", title: "Revisao final" },
];

const generos = [
  { value: "feminino", label: "Feminino" },
  { value: "masculino", label: "Masculino" },
  { value: "unissex", label: "Unissex" },
];

const inputClass =
  "w-full rounded-lg border border-[#E5DED2] bg-[#FFFEFA] px-3 py-2.5 text-base outline-none transition placeholder:text-slate-400 focus:border-[#16A36B] focus:bg-white sm:text-sm";

const labelClass = "mb-1.5 block text-xs font-medium uppercase text-slate-500";

const formatCurrency = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));

export default function ProdutoModal({ aoFechar, aoCadastrar }) {
  useModalPresence();

  const { lojaAtual } = useAuth();
  const lojaId = lojaAtual?.loja?.id;
  const podeAdicionarVideo = Number(lojaId) === 1;

  const [etapaAtual, setEtapaAtual] = useState(0);
  const [form, setForm] = useState({
    nome: "",
    marca: "",
    genero: "unissex",
    fornecedorId: "",
    preco: "",
    custoUnitario: "",
    outrosCustos: "",
  });
  const [fornecedores, setFornecedores] = useState([]);
  const [mostrarNovoFornecedor, setMostrarNovoFornecedor] = useState(false);
  const [novoFornecedor, setNovoFornecedor] = useState({ nome: "", telefone: "", observacao: "" });
  const [salvandoFornecedor, setSalvandoFornecedor] = useState(false);

  const [imagemPreview, setImagemPreview] = useState(null);
  const [imagemFile, setImagemFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  const [variacoes, setVariacoes] = useState([{ numeracao: "", estoque: "" }]);
  const [carregando, setCarregando] = useState(false);

  const etapa = etapas[etapaAtual];
  const progresso = ((etapaAtual + 1) / etapas.length) * 100;
  const fornecedorSelecionado = fornecedores.find((item) => String(item.id) === String(form.fornecedorId));
  const variacoesValidas = useMemo(
    () =>
      variacoes
        .map((v) => ({
          numeracao: String(v.numeracao || "").trim(),
          estoque: Number(v.estoque),
        }))
        .filter((v) => v.numeracao && Number.isInteger(v.estoque) && v.estoque >= 0),
    [variacoes]
  );

  useEffect(() => {
    carregarFornecedores();

    const listener = (event) => {
      if (event.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [aoFechar]);

  async function carregarFornecedores() {
    try {
      const { data } = await api.get("/fornecedores");
      setFornecedores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
      toast.error("Erro ao carregar fornecedores.");
    }
  }

  function handleChange(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  function handleVariacaoChange(index, campo, valor) {
    setVariacoes((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [campo]: valor } : item))
    );
  }

  function adicionarVariacao() {
    setVariacoes((prev) => [...prev, { numeracao: "", estoque: "" }]);
  }

  function removerVariacao(index) {
    setVariacoes((prev) => (prev.length > 1 ? prev.filter((_, itemIndex) => itemIndex !== index) : prev));
  }

  function adicionarGradeCompleta(tipo) {
    const grades = {
      baixa: ["34", "35", "36", "37", "38", "39"],
      alta: ["38", "39", "40", "41", "42", "43"],
    };

    const gradePronta = grades[tipo].map((numeracao, index) => ({
      numeracao,
      estoque: index === 2 || index === 3 ? "3" : "1",
    }));

    setVariacoes(gradePronta);
    toast.info(`Grade ${tipo} carregada. Ajuste conforme necessario.`);
  }

  async function fazerUploadImgBB() {
    if (!imagemFile) return "";

    const formData = new FormData();
    formData.append("image", imagemFile);

    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      return data.data.url;
    } catch (err) {
      console.error("Erro ao enviar para ImgBB:", err);
      return "";
    }
  }

  function handleSelecionarImagem(event) {
    const file = event.target.files[0];
    if (!file) return;

    setImagemPreview(URL.createObjectURL(file));
    setImagemFile(file);
  }

  function handleSelecionarVideo(event) {
    const file = event.target.files[0];
    if (!file) return;

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  }

  async function cadastrarFornecedorRapido() {
    const nome = novoFornecedor.nome.trim();
    if (!nome) {
      toast.error("Informe o nome do fornecedor.");
      return;
    }

    try {
      setSalvandoFornecedor(true);
      const { data } = await api.post("/fornecedores", novoFornecedor);
      setFornecedores((prev) => {
        const semDuplicado = prev.filter((item) => item.id !== data.id);
        return [...semDuplicado, data].sort((a, b) => a.nome.localeCompare(b.nome));
      });
      setForm((prev) => ({ ...prev, fornecedorId: String(data.id) }));
      setNovoFornecedor({ nome: "", telefone: "", observacao: "" });
      setMostrarNovoFornecedor(false);
      toast.success("Fornecedor selecionado.");
    } catch (error) {
      console.error("Erro ao cadastrar fornecedor:", error);
      toast.error(error.response?.data?.error || "Erro ao cadastrar fornecedor.");
    } finally {
      setSalvandoFornecedor(false);
    }
  }

  function validarEtapa(indice = etapaAtual) {
    if (indice === 0) {
      if (!form.nome.trim()) {
        toast.error("Informe o nome do produto.");
        return false;
      }
      if (!form.preco || Number(form.preco) < 0) {
        toast.error("Informe o preço corretamente.");
        return false;
      }
      if (form.custoUnitario !== "" && Number(form.custoUnitario) < 0) {
        toast.error("Informe o custo corretamente.");
        return false;
      }
      if (form.outrosCustos !== "" && Number(form.outrosCustos) < 0) {
        toast.error("Informe outros custos corretamente.");
        return false;
      }
    }

    if (indice === 2 && variacoesValidas.length === 0) {
      toast.error("Adicione ao menos uma numeracao.");
      return false;
    }

    return true;
  }

  function avancar() {
    if (!validarEtapa()) return;
    setEtapaAtual((prev) => Math.min(prev + 1, etapas.length - 1));
  }

  function voltar() {
    setEtapaAtual((prev) => Math.max(prev - 1, 0));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validarEtapa(0) || !validarEtapa(2)) return;

    setCarregando(true);

    try {
      let imagemUrl = "";
      let videoUrl = "";
      let gifUrl = "";

      if (imagemFile) imagemUrl = await fazerUploadImgBB();

      if (podeAdicionarVideo && videoFile) {
        const formData = new FormData();
        formData.append("video", videoFile);
        formData.append("nomeProduto", form.nome);

        const res = await api.post("/upload-video", formData);
        videoUrl = res.data.videoUrl || res.data.url;
        gifUrl = res.data.gifUrl;

        if (!videoUrl || !gifUrl) {
          console.error("Resposta inválida do upload de vídeo:", res.data);
          throw new Error("Upload de vídeo não retornou videoUrl/gifUrl.");
        }
      }

      await api.post("/produtos", {
        nome: form.nome.trim(),
        marca: form.marca.trim() || null,
        genero: form.genero,
        fornecedorId: form.fornecedorId || null,
        preco: Number(form.preco || 0),
        custoUnitario: Number(form.custoUnitario || 0),
        outrosCustos: Number(form.outrosCustos || 0),
        imagemUrl,
        videoUrl,
        gifUrl,
        variacoes: variacoesValidas,
      });

      toast.success("Produto cadastrado com sucesso!");
      setTimeout(() => aoCadastrar(), 500);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || "Erro ao cadastrar produto.");
    } finally {
      setCarregando(false);
    }
  }

  function renderDados() {
    return (
      <div className="space-y-4">
        <label>
          <span className={labelClass}>Nome do produto</span>
          <input
            type="text"
            name="nome"
            placeholder="Ex: Sandalia salto bloco"
            value={form.nome}
            onChange={handleChange}
            className={inputClass}
            autoFocus
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label>
            <span className={labelClass}>Marca</span>
            <input
              type="text"
              name="marca"
              placeholder="Ex: Vizzano"
              value={form.marca}
              onChange={handleChange}
              className={inputClass}
            />
          </label>

          <label>
            <span className={labelClass}>Genero</span>
            <select name="genero" value={form.genero} onChange={handleChange} className={inputClass}>
              {generos.map((genero) => (
                <option key={genero.value} value={genero.value}>
                  {genero.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className={labelClass}>Fornecedor</span>
            <div className="flex gap-2">
              <select
                name="fornecedorId"
                value={form.fornecedorId}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Sem fornecedor</option>
                {fornecedores.map((fornecedor) => (
                  <option key={fornecedor.id} value={fornecedor.id}>
                    {fornecedor.nome}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setMostrarNovoFornecedor((value) => !value)}
                className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-[#E5DED2] bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Plus size={15} /> Novo
              </button>
            </div>

            {mostrarNovoFornecedor && (
              <div className="mt-3 rounded-lg border border-[#E5DED2] bg-[#FFFEFA]/80 p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    value={novoFornecedor.nome}
                    onChange={(event) => setNovoFornecedor((prev) => ({ ...prev, nome: event.target.value }))}
                    placeholder="Nome do fornecedor"
                    className={inputClass}
                  />
                  <input
                    value={novoFornecedor.telefone}
                    onChange={(event) => setNovoFornecedor((prev) => ({ ...prev, telefone: event.target.value }))}
                    placeholder="Telefone opcional"
                    className={inputClass}
                  />
                </div>
                <textarea
                  rows={2}
                  value={novoFornecedor.observacao}
                  onChange={(event) => setNovoFornecedor((prev) => ({ ...prev, observacao: event.target.value }))}
                  placeholder="Observação opcional"
                  className={`${inputClass} mt-2 resize-none`}
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setMostrarNovoFornecedor(false)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={cadastrarFornecedorRapido}
                    disabled={salvandoFornecedor}
                    className="lojia-primary-action px-3 py-2 text-sm font-medium disabled:opacity-60"
                  >
                    {salvandoFornecedor ? "Salvando..." : "Salvar fornecedor"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label>
            <span className={labelClass}>Preco de venda</span>
            <input
              type="number"
              step="0.01"
              name="preco"
              placeholder="0,00"
              value={form.preco}
              onChange={handleChange}
              className={inputClass}
            />
          </label>
          <label>
            <span className={labelClass}>Custo unitario</span>
            <input
              type="number"
              step="0.01"
              name="custoUnitario"
              placeholder="0,00"
              value={form.custoUnitario}
              onChange={handleChange}
              className={inputClass}
            />
          </label>
          <label>
            <span className={labelClass}>Outros custos</span>
            <input
              type="number"
              step="0.01"
              name="outrosCustos"
              placeholder="0,00"
              value={form.outrosCustos}
              onChange={handleChange}
              className={inputClass}
            />
          </label>
        </div>
      </div>
    );
  }

  function renderMidia() {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="rounded-lg border border-dashed border-[#E5DED2] bg-[#FFFEFA]/70 p-4 text-center transition hover:bg-white">
            <ImagePlus className="mx-auto text-[#16A36B]" />
            <span className="mt-2 block text-sm font-semibold text-slate-950">Imagem do produto</span>
            <span className="mt-1 block text-xs text-slate-500">JPG, PNG ou WEBP</span>
            <input type="file" accept="image/*" onChange={handleSelecionarImagem} className="hidden" />
          </label>

          {podeAdicionarVideo ? (
            <label className="rounded-lg border border-dashed border-[#E5DED2] bg-[#FFFEFA]/70 p-4 text-center transition hover:bg-white">
              <ImagePlus className="mx-auto text-[#16A36B]" />
              <span className="mt-2 block text-sm font-semibold text-slate-950">Video do catalogo</span>
              <span className="mt-1 block text-xs text-slate-500">Disponivel para a loja principal</span>
              <input type="file" accept="video/*" onChange={handleSelecionarVideo} className="hidden" />
            </label>
          ) : (
            <div className="rounded-lg border border-[#E5DED2] bg-[#FFFEFA]/70 p-4 text-sm text-slate-500">
              <p className="font-semibold text-slate-950">Video indisponivel nesta loja</p>
              <p className="mt-1">Esta opcao sera liberada para outras lojas posteriormente.</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {imagemPreview ? (
            <div>
              <p className={labelClass}>Previa da imagem</p>
              <img src={imagemPreview} alt="Previa" className="h-40 w-full rounded-lg border border-slate-200 object-cover" />
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
              Nenhuma imagem selecionada.
            </div>
          )}

          {videoPreview && podeAdicionarVideo ? (
            <div>
              <p className={labelClass}>Prévia do vídeo</p>
              <video src={videoPreview} controls className="h-40 w-full rounded-lg border border-slate-200 object-cover" />
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
              Nenhum vídeo selecionado.
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderGrade() {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => adicionarGradeCompleta("baixa")} className="lojia-ghost-action px-3 py-2 text-sm font-medium">
            Grade baixa 34-39
          </button>
          <button type="button" onClick={() => adicionarGradeCompleta("alta")} className="lojia-ghost-action px-3 py-2 text-sm font-medium">
            Grade alta 38-43
          </button>
          <button type="button" onClick={adicionarVariacao} className="lojia-primary-action inline-flex items-center gap-2 px-3 py-2 text-sm font-medium">
            <Plus size={15} /> Adicionar tamanho
          </button>
        </div>

        <div className="space-y-2">
          {variacoes.map((variacao, index) => (
            <div key={index} className="grid grid-cols-[minmax(0,1fr)_120px_auto] gap-2">
              <input
                type="text"
                placeholder="Numeração"
                value={variacao.numeracao}
                onChange={(event) => handleVariacaoChange(index, "numeracao", event.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                min="0"
                placeholder="Estoque"
                value={variacao.estoque}
                onChange={(event) => handleVariacaoChange(index, "estoque", event.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removerVariacao(index)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                aria-label="Remover tamanho"
              >
                <X size={17} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderRevisao() {
    const totalPares = variacoesValidas.reduce((acc, item) => acc + item.estoque, 0);

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white/70 p-4">
          <div className="flex items-start gap-3">
            {imagemPreview ? (
              <img src={imagemPreview} alt="Produto" className="h-16 w-16 rounded-lg object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                <Shirt size={22} />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-950">{form.nome || "Produto sem nome"}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2 py-1 capitalize text-slate-600">{form.genero}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                  {form.marca || "Sem marca"}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                  {fornecedorSelecionado?.nome || "Sem fornecedor"}
                </span>
                {videoFile && podeAdicionarVideo && (
                  <span className="rounded-full bg-[#16A36B]/10 px-2 py-1 text-[#11875A]">Com vídeo</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ResumoItem icon={Tag} label="Venda" value={formatCurrency(form.preco)} />
          <ResumoItem icon={Truck} label="Custo" value={formatCurrency(form.custoUnitario)} />
          <ResumoItem icon={PackagePlus} label="Grade" value={`${totalPares} pares`} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white/70 p-4">
          <p className={labelClass}>Numeracoes</p>
          <div className="flex flex-wrap gap-2">
            {variacoesValidas.map((item) => (
              <span key={item.numeracao} className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700">
                {item.numeracao}: {item.estoque}
              </span>
            ))}
          </div>
          {variacoesValidas.some((item) => item.estoque === 0) && (
            <p className="mt-3 text-xs text-amber-700">Existe numeração com estoque zero.</p>
          )}
        </div>
      </div>
    );
  }

  function renderConteudo() {
    if (etapa.key === "dados") return renderDados();
    if (etapa.key === "midia") return renderMidia();
    if (etapa.key === "grade") return renderGrade();
    return renderRevisao();
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/50 px-0 py-0 backdrop-blur-sm sm:items-center sm:px-3 sm:py-4"
      onClick={aoFechar}
    >
      <div
        className="relative flex h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-none border border-slate-200/80 bg-[#FFFEFA] shadow-[0_28px_80px_rgba(24,31,36,0.24)] sm:h-auto sm:max-h-[92vh] sm:rounded-[24px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 border-b border-slate-200/80 bg-[#FFFEFA] px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Cadastrar produto</h2>
              <p className="mt-1 text-sm text-slate-500">{etapa.title}</p>
            </div>
            <button
              type="button"
              onClick={aoFechar}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-5">
            <div className="mb-2 grid grid-cols-4 gap-1 text-[11px] font-medium text-slate-500">
              {etapas.map((item, index) => (
                <span key={item.key} className={index <= etapaAtual ? "text-[#11875A]" : ""}>
                  {item.label}
                </span>
              ))}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#16A36B] to-[#20BD7A] transition-all duration-300"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F5EF]/50 px-4 py-5 sm:px-6">
            {renderConteudo()}
          </div>

          <div className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              {etapaAtual === 0 ? (
                <button
                  type="button"
                  onClick={aoFechar}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={voltar}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft size={14} /> Voltar
                </button>
              )}

              {etapaAtual === etapas.length - 1 ? (
                <button
                  type="submit"
                  disabled={carregando}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16A36B] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_26px_rgba(22,163,107,0.22)] transition hover:bg-[#11875A] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {carregando ? "Salvando..." : "Salvar produto"}
                  {!carregando && <Save size={15} />}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={avancar}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#181F24] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_26px_rgba(24,31,36,0.16)] transition hover:bg-[#26313A]"
                >
                  Proximo <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResumoItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/70 p-3">
      <p className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500">
        <Icon size={14} /> {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
