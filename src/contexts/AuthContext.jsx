import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("pdv_token"));
  const [usuario, setUsuario] = useState(null);
  const [lojas, setLojas] = useState([]);
  const [lojaAtualId, setLojaAtualIdState] = useState(() => localStorage.getItem("pdv_loja_id"));
  const [carregando, setCarregando] = useState(Boolean(localStorage.getItem("pdv_token")));

  const lojaAtual = useMemo(
    () => lojas.find((item) => String(item.loja.id) === String(lojaAtualId)) || lojas[0] || null,
    [lojaAtualId, lojas]
  );

  function aplicarSessao(data) {
    localStorage.setItem("pdv_token", data.token);
    setToken(data.token);
    setUsuario(data.usuario);
    setLojas(data.lojas || []);

    const primeiraLoja = data.lojas?.[0]?.loja?.id;
    if (primeiraLoja) {
      localStorage.setItem("pdv_loja_id", String(primeiraLoja));
      setLojaAtualIdState(String(primeiraLoja));
    }
  }

  function setLojaAtualId(id) {
    localStorage.setItem("pdv_loja_id", String(id));
    setLojaAtualIdState(String(id));
  }

  async function login(email, senha) {
    const { data } = await api.post("/auth/login", { email, senha });
    aplicarSessao(data);
    return data;
  }

  async function aceitarConvite(payload) {
    const { data } = await api.post("/auth/aceitar-convite", payload);
    aplicarSessao(data);
    return data;
  }

  async function bootstrapSuperadmin(payload) {
    const { data } = await api.post("/auth/bootstrap-superadmin", payload);
    aplicarSessao(data);
    return data;
  }

  function logout() {
    localStorage.removeItem("pdv_token");
    localStorage.removeItem("pdv_loja_id");
    setToken(null);
    setUsuario(null);
    setLojas([]);
    setLojaAtualIdState(null);
  }

  useEffect(() => {
    async function carregarSessao() {
      if (!token) {
        setCarregando(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        setUsuario(data.usuario);
        setLojas(data.lojas || []);

        const existeLoja = data.lojas?.some((item) => String(item.loja.id) === String(lojaAtualId));
        if (!existeLoja && data.lojas?.[0]?.loja?.id) {
          setLojaAtualId(data.lojas[0].loja.id);
        }
      } catch (error) {
        logout();
      } finally {
        setCarregando(false);
      }
    }

    carregarSessao();
  }, [token]);

  const value = {
    token,
    usuario,
    lojas,
    lojaAtual,
    carregando,
    autenticado: Boolean(token && usuario),
    login,
    aceitarConvite,
    bootstrapSuperadmin,
    logout,
    setLojaAtualId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
