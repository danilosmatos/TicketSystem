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
const formChamado = pegar("formChamado");
const formAdminData = pegar("formAdminData");
const btnSair = pegar("btnSair");

const perfilUsuario = pegar("perfilUsuario");
const meusChamados = pegar("meusChamados");
const todosChamados = pegar("todosChamados");
const statusTodosChamados = pegar("statusTodosChamados");
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

function criarCardChamado(chamado, idChamado, uidDono, mostrarAcoesAdmin) {
  const div = document.createElement("div");
  div.className = "chamado";

  div.innerHTML = `
    <h3>${chamado.title}</h3>
    <p><strong>Descrição:</strong> ${chamado.description}</p>
    <p><strong>Status:</strong> ${traduzirStatus(chamado.status)}</p>
    <p><strong>Dono:</strong> ${chamado.ownerEmail || uidDono}</p>
    <small>
      Criado em: ${formatarData(chamado.createdAt)}<br>
      Atualizado em: ${formatarData(chamado.updatedAt)}
    </small>
  `;

  if (mostrarAcoesAdmin) {
    const acoes = document.createElement("div");
    acoes.className = "acoes";

    acoes.innerHTML = `
      <button type="button" data-uid="${uidDono}" data-ticket="${idChamado}" data-status="open">
        Aberto
      </button>
      <button type="button" data-uid="${uidDono}" data-ticket="${idChamado}" data-status="in_progress">
        Em andamento
      </button>
      <button type="button" data-uid="${uidDono}" data-ticket="${idChamado}" data-status="closed">
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

formChamado.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  if (!auth.currentUser) {
    alert("Você precisa estar logado.");
    return;
  }

  const titulo = pegar("tituloChamado").value.trim();
  const descricao = pegar("descricaoChamado").value.trim();

  const uid = auth.currentUser.uid;
  const agora = Date.now();

  const chamado = {
    title: titulo,
    description: descricao,
    status: "open",
    createdBy: uid,
    ownerEmail: auth.currentUser.email,
    createdAt: agora,
    updatedAt: agora
  };

  try {
    const novoChamadoRef = push(ref(db, `tickets/${uid}`));

    await set(novoChamadoRef, chamado);

    formChamado.reset();
    registrarLog(`Chamado criado em /tickets/${uid}/${novoChamadoRef.key}`);
  } catch (erro) {
    registrarLog(`Erro ao criar chamado: ${erro.message}`);
    alert(`Erro ao criar chamado: ${erro.message}`);
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

todosChamados.addEventListener("click", async (evento) => {
  const botao = evento.target.closest("button[data-status]");

  if (!botao) {
    return;
  }

  const uidDono = botao.dataset.uid;
  const idChamado = botao.dataset.ticket;
  const novoStatus = botao.dataset.status;

  try {
    await update(ref(db, `tickets/${uidDono}/${idChamado}`), {
      status: novoStatus,
      updatedAt: Date.now()
    });

    registrarLog(`Status alterado em /tickets/${uidDono}/${idChamado}: ${novoStatus}`);
  } catch (erro) {
    registrarLog(`Erro ao alterar status: ${erro.message}`);
    alert(`Erro ao alterar status: ${erro.message}`);
  }
});

function mostrarMeusChamados(snapshot, uid) {
  meusChamados.innerHTML = "";

  if (!snapshot.exists()) {
    meusChamados.innerHTML = "<p>Nenhum chamado próprio encontrado.</p>";
    return;
  }

  const dados = snapshot.val();

  Object.entries(dados).forEach(([idChamado, chamado]) => {
    meusChamados.appendChild(criarCardChamado(chamado, idChamado, uid, false));
  });
}

function mostrarTodosChamados(snapshot) {
  todosChamados.innerHTML = "";

  if (!snapshot.exists()) {
    todosChamados.innerHTML = "<p>Nenhum chamado encontrado.</p>";
    return;
  }

  const dados = snapshot.val();

  Object.entries(dados).forEach(([uidDono, chamadosDoUsuario]) => {
    Object.entries(chamadosDoUsuario).forEach(([idChamado, chamado]) => {
      todosChamados.appendChild(criarCardChamado(chamado, idChamado, uidDono, true));
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

  const cancelarMeusChamados = onValue(
    ref(db, `tickets/${user.uid}`),
    (snapshot) => {
      mostrarMeusChamados(snapshot, user.uid);
      registrarLog("Leitura permitida: próprios chamados.");
    },
    (erro) => {
      meusChamados.innerHTML = "<p>Erro ao ler próprios chamados.</p>";
      registrarLog(`Erro em /tickets/${user.uid}: ${erro.message}`);
    }
  );

  canceladores.push(cancelarMeusChamados);

  const cancelarTodosChamados = onValue(
    ref(db, "tickets"),
    (snapshot) => {
      statusTodosChamados.textContent = "Acesso permitido: /tickets";
      statusTodosChamados.className = "status permitido";

      mostrarTodosChamados(snapshot);
      registrarLog("Leitura permitida: /tickets inteiro.");
    },
    (erro) => {
      statusTodosChamados.textContent = "Acesso negado: somente admin pode ler /tickets inteiro.";
      statusTodosChamados.className = "status negado";
      todosChamados.innerHTML = "";

      registrarLog(`Acesso negado em /tickets: ${erro.message}`);
    }
  );

  canceladores.push(cancelarTodosChamados);

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
    meusChamados.innerHTML = "";
    todosChamados.innerHTML = "";
    adminDataView.textContent = "";
    statusTodosChamados.textContent = "Aguardando login.";
    statusTodosChamados.className = "status";
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