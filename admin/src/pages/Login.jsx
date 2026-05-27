import { useState } from "react";

import toast from "react-hot-toast";

import api from "../services/api";

function Login() {

  const [email, setEmail] =
    useState("");

  const [senha, setSenha] =
    useState("");





  async function fazerLogin() {

    try {

      const response =
        await api.post(
          "/auth/login",
          {
            email,
            senha
          }
        );

      localStorage.setItem(
        "token",
        response.data.token
      );

      localStorage.setItem(
        "admin",
        JSON.stringify(
          response.data.admin
        )
      );

      toast.success(
        "Login realizado"
      );

      window.location.href = "/";

    } catch (error) {

      console.log(error);

      toast.error(
        "Erro no login"
      );

    }

  }





  return (

    <div className="login-container">

      <div className="login-box">

        <h1>
          Conceito Admin
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) =>
            setSenha(e.target.value)
          }
        />

        <button
          onClick={fazerLogin}
        >
          Entrar
        </button>

      </div>

    </div>

  );

}

export default Login;