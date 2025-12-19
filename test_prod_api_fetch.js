const API_URL = "https://react-chat-app-t2nv.vercel.app";

async function testBackend() {
  console.log(`Testing Backend at: ${API_URL}`);

  try {
    // 1. Test Root
    console.log("\n1. Testing Root (GET /)...");
    const rootRes = await fetch(`${API_URL}/`);
    const rootText = await rootRes.text();
    console.log("Root Status:", rootRes.status);
    console.log("Root Response:", rootText);

    // 2. Test Register (POST /api/auth/register)
    console.log("\n2. Testing Register (POST /api/auth/register)...");
    try {
      const regRes = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "test_vercel",
          email: `test_${Date.now()}@example.com`,
          password: "password123",
        }),
      });
      const regData = await regRes.json();
      console.log("Register Status:", regRes.status);
      console.log("Register Response:", regData);
    } catch (err) {
      console.log("Register Request failed:", err.message);
    }

    // 3. Test Login
    console.log("\n3. Testing Login (POST /api/auth/login)...");
    try {
      const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });
      const loginData = await loginRes.json();
      console.log("Login Status:", loginRes.status);
      console.log("Login Response:", loginData);
    } catch (err) {
      console.log("Login Request failed:", err.message);
    }
  } catch (err) {
    console.error("Test failed unexpectedly:", err.message);
  }
}

testBackend();
