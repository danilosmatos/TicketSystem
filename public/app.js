import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
  getDatabase,
  ref,
  set,
  get,
  push,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDhm6xgr2xkJB6wdDywUIEwBKseQhTMPb4",
  authDomain: "modelagem-dados.firebaseapp.com",
  databaseURL: "https://modelagem-dados-default-rtdb.firebaseio.com",
  projectId: "modelagem-dados",
  storageBucket: "modelagem-dados.firebasestorage.app",
  messagingSenderId: "922942063548",
  appId: "1:922942063548:web:eb2f354e45dab4c10021b9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const pegar = (id) => document.getElementById(id);

const areaAuth = pegar("areaAuth");
const areaSistema = pegar("areaSistema");
const sessao = pegar("sessao");
const usuarioLogado = pegar("usuarioLogado");
const cargoUsuario = pegar("cargoUsuario");

const formCadastro = pegar("formCadastro");
const formLogin = pegar("formLogin");
const formTicket = pegar("formTicket");
const formAdminData = pegar("formAdminData");
const btnSair = pegar("btnSair");

const perfilUsuario = pegar("perfilUsuario");
const meusTickets = pegar("meusTickets");
const todosTickets = pegar("todosTickets");
const statusTodosTickets = pegar("statusTodosTickets");
const statusAdminData = pegar("statusAdminData");
const adminDataView = pegar("adminDataView");
const logSistema = pegar("logSistema");

let canceladores = [];

function registrarLog(texto) {
  const hora = new Date().toLocaleTimeString("pt-BR");
  logSistema.textContent = `[${hora}] ${texto}\n` + logSistema.textContent;
}

function limparListeners() {
  canceladores.forEach((cancelar) => cancelar());
  canceladores = [];
}

function formatarData(timestamp) {
  if (!timestamp) {
    return "Sem data";
  }

  return new Date(timestamp).toLocaleString("pt-BR");
}

function traduzirStatus(status) {
  const mapa = {
    open: "Aberto",
    in_progress: "Em andamento",
    closed: "Fechado"
  };

  return mapa[status] || status;
}

function criarCardTicket(ticket, idTicket, uidDono, mostrarAcoesAdmin) {
  const div = document.createElement("div");
  div.className = "ticket";

  div.innerHTML = `
    <h3>${ticket.title}</h3>
    <p><strong>Descrição:</strong> ${ticket.description}</p>
    <p><strong>Status:</strong> ${traduzirStatus(ticket.status)}</p>
    <p><strong>Dono:</strong> ${ticket.ownerEmail || uidDono}</p>
    <small>
      Criado em: ${formatarData(ticket.createdAt)}<br>
      Atualizado em: ${formatarData(ticket.updatedAt)}
    </small>
  `;

  if (mostrarAcoesAdmin) {
    const acoes = document.createElement("div");
    acoes.className = "acoes";

    acoes.innerHTML = `
      <button type="button" data-uid="${uidDono}" data-ticket="${idTicket}" data-status="open">
        Aberto
      </button>
      <button type="button" data-uid="${uidDono}" data-ticket="${idTicket}" data-status="in_progress">
        Em andamento
      </button>
      <button type="button" data-uid="${uidDono}" data-ticket="${idTicket}" data-status="closed">
        Fechado
      </button>
    `;

    div.appendChild(acoes);
  }

  return div;
}

async function buscarPerfil(uid) {
  const snapshot = await get(ref(db, `users/${uid}`));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val();
}

async function criarPerfilUsuario(user, nome) {
  const perfil = {
    name: nome,
    email: user.email,
    role: "user",
    createdAt: Date.now()
  };

  await set(ref(db, `users/${user.uid}`), perfil);

  return perfil;
}

formCadastro.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const nome = pegar("cadastroNome").value.trim();
  const email = pegar("cadastroEmail").value.trim();
  const senha = pegar("cadastroSenha").value;

  try {
    const credencial = await createUserWithEmailAndPassword(auth, email, senha);

    await criarPerfilUsuario(credencial.user, nome);

    formCadastro.reset();
    registrarLog(`Conta criada: ${email}. Cargo salvo no banco: user.`);
  } catch (erro) {
    registrarLog(`Erro no cadastro: ${erro.message}`);
    alert(`Erro no cadastro: ${erro.message}`);
  }
});

formLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const email = pegar("loginEmail").value.trim();
  const senha = pegar("loginSenha").value;

  try {
    await signInWithEmailAndPassword(auth, email, senha);

    formLogin.reset();
    registrarLog(`Login realizado: ${email}`);
  } catch (erro) {
    registrarLog(`Erro no login: ${erro.message}`);
    alert(`Erro no login: ${erro.message}`);
  }
});

btnSair.addEventListener("click", async () => {
  try {
    await signOut(auth);
    registrarLog("Logout realizado.");
  } catch (erro) {
    registrarLog(`Erro ao sair: ${erro.message}`);
  }
});

formTicket.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  if (!auth.currentUser) {
    alert("Você precisa estar logado.");
    return;
  }

  const titulo = pegar("tituloTicket").value.trim();
  const descricao = pegar("descricaoTicket").value.trim();

  const uid = auth.currentUser.uid;
  const agora = Date.now();

  const ticket = {
    title: titulo,
    description: descricao,
    status: "open",
    createdBy: uid,
    ownerEmail: auth.currentUser.email,
    createdAt: agora,
    updatedAt: agora
  };

  try {
    const novoTicketRef = push(ref(db, `tickets/${uid}`));

    await set(novoTicketRef, ticket);

    formTicket.reset();
    registrarLog(`Ticket criado em /tickets/${uid}/${novoTicketRef.key}`);
  } catch (erro) {
    registrarLog(`Erro ao criar ticket: ${erro.message}`);
    alert(`Erro ao criar ticket: ${erro.message}`);
  }
});

formAdminData.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  if (!auth.currentUser) {
    alert("Você precisa estar logado.");
    return;
  }

  const texto = pegar("textoAdminData").value.trim();

  try {
    await set(ref(db, "admin-data"), {
      notice: texto,
      lastUpdated: Date.now(),
      updatedBy: auth.currentUser.uid
    });

    registrarLog("Gravação permitida em /admin-data.");
  } catch (erro) {
    registrarLog(`Gravação negada em /admin-data: ${erro.message}`);
    alert(`Gravação negada em /admin-data: ${erro.message}`);
  }
});

todosTickets.addEventListener("click", async (evento) => {
  const botao = evento.target.closest("button[data-status]");

  if (!botao) {
    return;
  }

  const uidDono = botao.dataset.uid;
  const idTicket = botao.dataset.ticket;
  const novoStatus = botao.dataset.status;

  try {
    await update(ref(db, `tickets/${uidDono}/${idTicket}`), {
      status: novoStatus,
      updatedAt: Date.now()
    });

    registrarLog(`Status alterado em /tickets/${uidDono}/${idTicket}: ${novoStatus}`);
  } catch (erro) {
    registrarLog(`Erro ao alterar status: ${erro.message}`);
    alert(`Erro ao alterar status: ${erro.message}`);
  }
});

function mostrarMeusTickets(snapshot, uid) {
  meusTickets.innerHTML = "";

  if (!snapshot.exists()) {
    meusTickets.innerHTML = "<p>Nenhum ticket próprio encontrado.</p>";
    return;
  }

  const dados = snapshot.val();

  Object.entries(dados).forEach(([idTicket, ticket]) => {
    meusTickets.appendChild(criarCardTicket(ticket, idTicket, uid, false));
  });
}

function mostrarTodosTickets(snapshot) {
  todosTickets.innerHTML = "";

  if (!snapshot.exists()) {
    todosTickets.innerHTML = "<p>Nenhum ticket encontrado.</p>";
    return;
  }

  const dados = snapshot.val();

  Object.entries(dados).forEach(([uidDono, ticketsDoUsuario]) => {
    Object.entries(ticketsDoUsuario).forEach(([idTicket, ticket]) => {
      todosTickets.appendChild(criarCardTicket(ticket, idTicket, uidDono, true));
    });
  });
}

function iniciarLeituras(user, perfil) {
  limparListeners();

  perfilUsuario.textContent = JSON.stringify(
    {
      uid: user.uid,
      ...perfil
    },
    null,
    2
  );

  const cancelarMeusTickets = onValue(
    ref(db, `tickets/${user.uid}`),
    (snapshot) => {
      mostrarMeusTickets(snapshot, user.uid);
      registrarLog("Leitura permitida: próprios tickets.");
    },
    (erro) => {
      meusTickets.innerHTML = "<p>Erro ao ler próprios tickets.</p>";
      registrarLog(`Erro em /tickets/${user.uid}: ${erro.message}`);
    }
  );

  canceladores.push(cancelarMeusTickets);

  const cancelarTodosTickets = onValue(
    ref(db, "tickets"),
    (snapshot) => {
      statusTodosTickets.textContent = "Acesso permitido: /tickets";
      statusTodosTickets.className = "status permitido";

      mostrarTodosTickets(snapshot);
      registrarLog("Leitura permitida: /tickets inteiro.");
    },
    (erro) => {
      statusTodosTickets.textContent = "Acesso negado: somente admin pode ler /tickets inteiro.";
      statusTodosTickets.className = "status negado";
      todosTickets.innerHTML = "";

      registrarLog(`Acesso negado em /tickets: ${erro.message}`);
    }
  );

  canceladores.push(cancelarTodosTickets);

  const cancelarAdminData = onValue(
    ref(db, "admin-data"),
    (snapshot) => {
      statusAdminData.textContent = "Acesso permitido: /admin-data";
      statusAdminData.className = "status permitido";

      adminDataView.textContent = JSON.stringify(snapshot.val(), null, 2);
      registrarLog("Leitura permitida: /admin-data.");
    },
    (erro) => {
      statusAdminData.textContent = "Acesso negado: somente admin pode ler /admin-data.";
      statusAdminData.className = "status negado";
      adminDataView.textContent = "";

      registrarLog(`Acesso negado em /admin-data: ${erro.message}`);
    }
  );

  canceladores.push(cancelarAdminData);
}

onAuthStateChanged(auth, async (user) => {
  limparListeners();

  if (!user) {
    areaAuth.classList.remove("escondido");
    areaSistema.classList.add("escondido");
    sessao.classList.add("escondido");

    perfilUsuario.textContent = "Nenhum usuário logado.";
    meusTickets.innerHTML = "";
    todosTickets.innerHTML = "";
    adminDataView.textContent = "";
    statusTodosTickets.textContent = "Aguardando login.";
    statusTodosTickets.className = "status";
    statusAdminData.textContent = "Aguardando login.";
    statusAdminData.className = "status";

    return;
  }

  try {
    let perfil = await buscarPerfil(user.uid);

    if (!perfil) {
      perfil = await criarPerfilUsuario(user, user.email || "Usuário");
      registrarLog("Perfil inexistente criado automaticamente com cargo user.");
    }

    areaAuth.classList.add("escondido");
    areaSistema.classList.remove("escondido");
    sessao.classList.remove("escondido");

    usuarioLogado.textContent = user.email;
    cargoUsuario.textContent = perfil.role.toUpperCase();

    registrarLog(`Sessão ativa. UID: ${user.uid}. Cargo: ${perfil.role}.`);

    iniciarLeituras(user, perfil);
  } catch (erro) {
    registrarLog(`Erro ao carregar perfil: ${erro.message}`);
    alert(`Erro ao carregar perfil: ${erro.message}`);
  }
});