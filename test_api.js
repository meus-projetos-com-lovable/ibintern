const baseUrl = "http://localhost:8000";

async function runTest() {
  console.log("Testing Login...");
  const loginRes = await fetch(`${baseUrl}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'aluno01', password: 'senha123' })
  });
  
  if (!loginRes.ok) {
    const err = await loginRes.text();
    console.log("Login failed:", loginRes.status, err);
    return;
  }
  
  const tokens = await loginRes.json();
  console.log("Login OK! Access:", tokens.access.slice(0, 20) + "...");
  
  const headers = {
    'Authorization': `Bearer ${tokens.access}`,
    'Content-Type': 'application/json'
  };
  
  console.log("\nTesting Listar Alunos...");
  const alunosRes = await fetch(`${baseUrl}/aluno/`, { headers });
  console.log("Alunos Response Status:", alunosRes.status);
  
  console.log("\nTesting Listar Processos...");
  const processosRes = await fetch(`${baseUrl}/processo/`, { headers });
  console.log("Processos Response Status:", processosRes.status);
  
  if (processosRes.ok) {
    const data = await processosRes.json();
    console.log("Processos count:", data.count);
  }
  
  console.log("\nTesting Criar Processo...");
  const createRes = await fetch(`${baseUrl}/processo/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      nome_empresa: "Empresa Teste",
      matricula_secretaria: "sec01",
      matricula_coordenacao: "coord01"
    })
  });
  
  console.log("Create Processo Status:", createRes.status);
  if (!createRes.ok) {
    console.log("Create Error:", await createRes.text());
  } else {
    console.log("Create Success:", await createRes.json());
  }
  
  console.log("\nAll tests finished.");
}

runTest();
