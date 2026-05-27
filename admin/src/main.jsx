import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import { BrowserRouter } from "react-router-dom";

import { Toaster } from "react-hot-toast";

import "./styles/global.css";
import "./styles/dashboard.css";
import "./styles/produtos.css";
import "./styles/pedidos.css";
import "./styles/modal.css";
import "./styles/responsive.css";
import "./styles/animations.css";
import "./styles/cozinha.css";
import "./styles/tracking.css";
import "leaflet/dist/leaflet.css";
import "./styles/entregador.css";

if ("Notification" in window) {

  Notification.requestPermission();

}


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>

    <BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#111827",
            color: "#fff",
            border: "1px solid #22c55e"
          }
        }}
      />

      <App />

    </BrowserRouter>

  </React.StrictMode>
);