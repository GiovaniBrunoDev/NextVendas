import { useEffect, useState } from "react";
import { Building2, FileText, Home, MapPin, Phone, Save, UserRound, X } from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";
import useModalPresence from "../hooks/useModalPresence";

export default function ClienteModal({ aoFechar, clienteAtual = null, aoSalvar }) {
  useModalPresence();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");
  const [bairro, setBairro] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);

  const editando = !!clienteAtual;

  useEffect(() => {
    if (clienteAtual) {
      setNome(clienteAtual.nome || "");
      setTelefone(clienteAtual.telefone || "");
      setEndereco(clienteAtual.endereco || "");
      setCidade(clienteAtual.cidade || "");
      setEstado(clienteAtual.estado || "");
      setCep(clienteAtual.cep || "");
      setBairro(clienteAtual.bairro || "");
      setObservacoes(clienteAtual.observacoes || "");
    } else {
      setNome("");
      setTelefone("");
      setEndereco("");
      setCidade("");
      setEstado("");
      setCep("");
      setBairro("");
      setObservacoes("");
    }
  }, [clienteAtual]);

  const salvarCliente = async () => {
    if (!nome.trim()) {
      toast.error("Digite o nome do cliente.");
      return;
    }

    const clienteData = {
      nome: nome.trim(),
      telefone: telefone.trim() || null,
      endereco: endereco.trim() || null,
      bairro: bairro.trim() || null,
      cidade: cidade.trim() || null,
      estado: estado.trim() || null,
      cep: cep.trim() || null,
      observacoes: observacoes.trim() || null,
    };

    try {
      setSalvando(true);
      if (editando) {
        await api.put(`/clientes/${clienteAtual.id}`, clienteData);
        toast.success("Cliente atualizado.");
      } else {
        await api.post("/clientes", clienteData);
        toast.success("Cliente cadastrado.");
      }
      aoSalvar();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar cliente.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 px-3 py-5 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-slate-500">
              <UserRound size={14} /> {editando ? "Editar cliente" : "Novo cliente"}
            </p>
            <h2 className="text-xl font-semibold text-slate-950">
              {editando ? clienteAtual.nome || "Cliente" : "Cadastrar cliente"}
            </h2>
          </div>
          <button
            onClick={aoFechar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Input label="Nome" icon={UserRound} value={nome} setValue={setNome} placeholder="Nome completo" required />
          <Input label="Telefone" icon={Phone} value={telefone} setValue={setTelefone} placeholder="(00) 00000-0000" />
          <Input label="Endereço" icon={Home} value={endereco} setValue={setEndereco} placeholder="Rua, número..." />
          <Input label="Bairro" icon={MapPin} value={bairro} setValue={setBairro} placeholder="Bairro" />
          <Input label="Cidade" icon={Building2} value={cidade} setValue={setCidade} placeholder="Cidade" />
          <div className="grid grid-cols-[1fr_1.3fr] gap-3">
            <Input label="UF" icon={MapPin} value={estado} setValue={setEstado} placeholder="UF" />
            <Input label="CEP" icon={MapPin} value={cep} setValue={setCep} placeholder="00000-000" />
          </div>
          <Textarea
            label="Observações"
            icon={FileText}
            value={observacoes}
            setValue={setObservacoes}
            placeholder="Preferências, referência de entrega ou detalhes úteis"
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button onClick={aoFechar} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancelar
          </button>
          <button
            onClick={salvarCliente}
            disabled={salvando}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={16} /> {salvando ? "Salvando..." : editando ? "Atualizar" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, icon: Icon, value, setValue, placeholder, type = "text", required = false }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-slate-500">
        <Icon size={14} /> {label}
      </span>
      <input
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
        type={type}
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={(e) => setValue(e.target.value)}
      />
    </label>
  );
}

function Textarea({ label, icon: Icon, value, setValue, placeholder }) {
  return (
    <label className="block sm:col-span-2">
      <span className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-slate-500">
        <Icon size={14} /> {label}
      </span>
      <textarea
        className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
        rows={3}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </label>
  );
}
