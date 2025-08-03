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

  const InputGroup = ({ label, icon, value, onChange, placeholder, type = "text" }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-600 mb-1">{label}</label>
    <div className="flex items-center border rounded px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-blue-500">
      {icon}
      <input
        type={type}
        className="flex-1 bg-transparent outline-none text-sm text-gray-800"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          // Protege contra valores inválidos que podem causar renderizações interrompidas
          const val = e.target.value;
          requestAnimationFrame(() => onChange({ target: { value: val } }));
        }}
      />
    </div>
  </div>
);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white p-6 rounded-2xl w-full max-w-xl shadow-xl border animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-blue-700">
            {editando ? "✏️ Editar Cliente" : "👤 Novo Cliente"}
          </h2>
          <button onClick={aoFechar} className="text-gray-500 hover:text-red-500 transition">
            <FaTimes />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Nome */}
  <div>
    <label className="text-sm font-medium text-gray-600">Nome</label>
    <div className="flex items-center border rounded px-3 py-2 mt-1">
      <FaUser className="text-gray-400 mr-2" />
      <input
        className="flex-1 outline-none text-sm"
        type="text"
        placeholder="Nome completo"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
    </div>
  </div>

  {/* Telefone */}
  <div>
    <label className="text-sm font-medium text-gray-600">Telefone</label>
    <div className="flex items-center border rounded px-3 py-2 mt-1">
      <FaPhone className="text-gray-400 mr-2" />
      <input
        className="flex-1 outline-none text-sm"
        type="text"
        placeholder="(00) 00000-0000"
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
      />
    </div>
  </div>

  {/* Endereço */}
  <div>
    <label className="text-sm font-medium text-gray-600">Endereço</label>
    <div className="flex items-center border rounded px-3 py-2 mt-1">
      <FaMapMarkerAlt className="text-gray-400 mr-2" />
      <input
        className="flex-1 outline-none text-sm"
        type="text"
        placeholder="Rua, número, complemento"
        value={endereco}
        onChange={(e) => setEndereco(e.target.value)}
      />
    </div>
  </div>

  {/* Bairro */}
  <div>
    <label className="text-sm font-medium text-gray-600">Bairro</label>
    <div className="flex items-center border rounded px-3 py-2 mt-1">
      <FaMapMarkerAlt className="text-gray-400 mr-2" />
      <input
        className="flex-1 outline-none text-sm"
        type="text"
        placeholder="Bairro"
        value={bairro}
        onChange={(e) => setBairro(e.target.value)}
      />
    </div>
  </div>

  {/* Cidade */}
  <div>
    <label className="text-sm font-medium text-gray-600">Cidade</label>
    <div className="flex items-center border rounded px-3 py-2 mt-1">
      <FaCity className="text-gray-400 mr-2" />
      <input
        className="flex-1 outline-none text-sm"
        type="text"
        placeholder="Cidade"
        value={cidade}
        onChange={(e) => setCidade(e.target.value)}
      />
    </div>
  </div>

  {/* Estado */}
  <div>
    <label className="text-sm font-medium text-gray-600">Estado</label>
    <div className="flex items-center border rounded px-3 py-2 mt-1">
      <FaMapMarkerAlt className="text-gray-400 mr-2" />
      <input
        className="flex-1 outline-none text-sm"
        type="text"
        placeholder="Estado (UF)"
        value={estado}
        onChange={(e) => setEstado(e.target.value)}
      />
    </div>
  </div>

  {/* CEP */}
  <div>
    <label className="text-sm font-medium text-gray-600">CEP</label>
    <div className="flex items-center border rounded px-3 py-2 mt-1">
      <FaMapMarkerAlt className="text-gray-400 mr-2" />
      <input
        className="flex-1 outline-none text-sm"
        type="text"
        placeholder="00000-000"
        value={cep}
        onChange={(e) => setCep(e.target.value)}
      />
    </div>
  </div>

  {/* Observações */}
  <div className="md:col-span-2">
    <label className="text-sm font-medium text-gray-600">Observações</label>
    <div className="flex items-start border rounded px-3 py-2 mt-1">
      <FaStickyNote className="text-gray-400 mr-2 mt-1" />
      <textarea
        className="flex-1 outline-none text-sm resize-none"
        rows={2}
        placeholder="Anotações sobre o cliente..."
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
      />
    </div>
  </div>
</div>


        <div className="mt-6 flex justify-end">
          <button
            onClick={salvarCliente}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow flex items-center gap-2 transition active:scale-95"
          >
            <FaSave size={16} />
            {editando ? "Atualizar" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
