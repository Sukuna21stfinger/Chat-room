const API = 'http://localhost:5000/api';
const fetchFn = globalThis.fetch || (url => { throw new Error('global fetch is not available in this Node runtime.'); });

async function run() {
  try {
    console.log('Starting demo test...');

    // Register
    const regRes = await fetchFn(API + '/auth/register', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({ username: 'demo_script', email: 'demo_script@example.com', password: 'Demo123!' })
    });
    const regJson = await regRes.json().catch(()=>null);
    console.log('Register response:', regRes.status, regJson);

    // Login
    const loginRes = await fetchFn(API + '/auth/login', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({ email: 'demo_script@example.com', password: 'Demo123!' })
    });
    const loginJson = await loginRes.json();
    console.log('Login response:', loginRes.status, loginJson);
    const token = loginJson.token;
    if(!token) {
      console.error('Login failed; aborting demo.');
      process.exit(1);
    }

    // Create a room
    const roomRes = await fetchFn(API + '/rooms', {
      method: 'POST',
      headers: {'content-type': 'application/json', 'authorization': `Bearer ${token}`},
      body: JSON.stringify({ name: 'Demo Room', description: 'Room created during demo', createdBy: 'demo_script' })
    });
    const roomJson = await roomRes.json();
    console.log('Create room response:', roomRes.status, roomJson);

    // List rooms
    const roomsRes = await fetchFn(API + '/rooms');
    const roomsJson = await roomsRes.json();
    console.log('Rooms list:', roomsJson.map(r=>({id:r._id,name:r.name})).slice(0,10));

    console.log('Demo test completed successfully.');
  } catch (err) {
    console.error('Demo test error:', err);
    process.exit(1);
  }
}

run();
