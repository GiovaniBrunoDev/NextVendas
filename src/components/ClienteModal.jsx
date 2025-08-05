import { useState, useEffect } from "react";
import {
  FaUser,
  FaPhone,
  FaSave,
  FaTimes,
  FaMapMarkerAlt,
  FaCity,
  FaStickyNote,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../services/api";

export default function ClienteModal({ aoFechar, clienteAtual = null, aoSalvar }) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");
  const [bairro, setBairro] = useState("");
  const [observacoes, setObservacoes] = useState("");

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
    if (!nome) {
      toast.error("Digite o nome do Cliente!");
      return;
    }

    const clienteData = {
      nome,
      telefone,
      endereco,
      bairro,
      cidade,
      estado,
      cep,
      observacoes,
    };

    try {
      if (editando) {
        await api.put(`/clientes/${clienteAtual.id}`, clienteData);
        toast.success("Cliente atualizado com sucesso!");
      } else {
        await api.post("/clientes", clienteData);
        toast.success("Cliente cadastrado com sucesso!");
      }
      aoSalvar();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar cliente.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 px-2 sm:px-4 overflow-y-auto">
      <div className="bg-white p-6 rounded-2xl w-full max-w-xl shadow-xl border animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-blue-700">
            {editando ? "✏️ Editar Cliente" : "👤 Novo Cliente"}
          </h2>
          <button onClick={aoFechar} className="text-gray-500 hover:text-red-500 transition">
            <FaTimes />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nome" icon={<FaUser className="text-gray-400 mr-2" />} value={nome} setValue={setNome} placeholder="Nome completo" />
          <Input label="Telefone" icon={<FaPhone className="text-gray-400 mr-2" />} value={telefone} setValue={setTelefone} placeholder="(00) 00000-0000" />
          <Input label="Endereço" icon={<FaMapMarkerAlt className="text-gray-400 mr-2" />} value={endereco} setValue={setEndereco} placeholder="Rua, número..." />
          <Input label="Bairro" icon={<FaMapMarkerAlt className="text-gray-400 mr-2" />} value={bairro} setValue={setBairro} placeholder="Bairro" />
          <Input label="Cidade" icon={<FaCity className="text-gray-400 mr-2" />} value={cidade} setValue={setCidade} placeholder="Cidade" />
          <Input label="Estado" icon={<FaMapMarkerAlt className="text-gray-400 mr-2" />} value={estado} setValue={setEstado} placeholder="UF" />
          <Input label="CEP" icon={<FaMapMarkerAlt className="text-gray-400 mr-2" />} value={cep} setValue={setCep} placeholder="00000-000" />
          <Textarea label="Observações" icon={<FaStickyNote className="text-gray-400 mr-2 mt-1" />} value={observacoes} setValue={setObservacoes} placeholder="Anotações sobre o cliente..." />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={salvarCliente}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow flex items-center gap-2 transition active:scale-95"
          >
            <FaSave size={16} /> {editando ? "Atualizar" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, icon, value, setValue, placeholder, type = "text" }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <div className="flex items-center border rounded px-3 py-2 mt-1">
        {icon}
        <input
          className="flex-1 outline-none text-sm bg-transparent"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    </div>
  );
}

function Textarea({ label, icon, value, setValue, placeholder }) {
  return (
    <div className="sm:col-span-2">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <div className="flex items-start border rounded px-3 py-2 mt-1">
        {icon}
        <textarea
          className="flex-1 outline-none text-sm resize-none bg-transparent"
          rows={2}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    </div>
  );
}
