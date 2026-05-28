import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Plus, X } from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";

const defaultSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 44,
    borderRadius: 8,
    borderColor: state.isFocused ? "#16A36B" : "#e2e8f0",
    boxShadow: "none",
    fontSize: 16,
    "&:hover": { borderColor: "#16A36B" },
  }),
  menu: (base) => ({ ...base, zIndex: 10001 }),
  menuPortal: (base) => ({ ...base, zIndex: 10001 }),
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#16A36B] focus:ring-3 focus:ring-[#16A36B]/10 sm:text-sm";

function formatTelefone(value) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1)$2")
    .replace(/(\d{5})(\d{4})$/, "$1-$2")
    .substring(0, 14);
}

export default function EntregadorSelect({ value, onChange, selectStyles = defaultSelectStyles }) {
  const [entregadores, setEntregadores] = useState([]);
  const [novoAberto, setNovoAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [salvando, setSalvando] = useState(false);

  const opcoes = useMemo(
    () =>
      entregadores.map((entregador) => ({
        value: entregador.nome,
        label: entregador.telefone ? `${entregador.nome} - ${entregador.telefone}` : entregador.nome,
        entregador,
      })),
    [entregadores]
  );

  useEffect(() => {
    carregarEntregadores();
  }, []);

  async function carregarEntregadores() {
    try {
      const { data } = await api.get("/entregadores");
      setEntregadores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar entregadores:", error);
    }
  }

  async function salvarEntregador() {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      toast.error("Informe o nome do entregador.");
      return;
    }

    try {
      setSalvando(true);
      const { data } = await api.post("/entregadores", {
        nome: nomeLimpo,
        telefone: telefone.trim() || null,
      });
      setEntregadores((prev) => {
        const semDuplicado = prev.filter((item) => item.id !== data.id);
        return [...semDuplicado, data].sort((a, b) => a.nome.localeCompare(b.nome));
      });
      onChange(data.nome);
      setNome("");
      setTelefone("");
      setNovoAberto(false);
      toast.success("Entregador cadastrado.");
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao cadastrar entregador.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Select
          options={opcoes}
          styles={selectStyles}
          value={opcoes.find((opcao) => opcao.value === value) || null}
          onChange={(opcao) => onChange(opcao?.value || "")}
          placeholder="Selecionar entregador"
          isClearable
          menuPortalTarget={document.body}
          noOptionsMessage={() => "Nenhum entregador cadastrado"}
        />
        <button
          type="button"
          onClick={() => setNovoAberto((aberto) => !aberto)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-[#16A36B]/40 hover:bg-slate-50"
        >
          {novoAberto ? <X size={16} /> : <Plus size={16} />}
          Novo
        </button>
      </div>

      {novoAberto && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_12px_30px_rgba(24,31,36,0.045)]">
          <div className="grid gap-2 sm:grid-cols-[1fr_150px_auto] sm:items-end">
            <label>
              <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Nome</span>
              <input
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Nome do entregador"
                className={inputClass}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Telefone</span>
              <input
                type="text"
                value={telefone}
                onChange={(event) => setTelefone(formatTelefone(event.target.value))}
                placeholder="Opcional"
                className={inputClass}
              />
            </label>
            <button
              type="button"
              onClick={salvarEntregador}
              disabled={salvando}
              className="min-h-11 rounded-xl bg-[#020C2C] px-4 text-sm font-semibold text-white transition hover:bg-[#081743] disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
