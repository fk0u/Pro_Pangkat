async function testLogin() {
  try {
    console.log('Testing login API...');
    
    // Test login dengan user yang sudah dibuat
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nip: 'test123',
        password: 'password'
      })
    });

    console.log('Login status:', loginResponse.status);
    
    if (loginResponse.status === 200) {
      const loginData = await loginResponse.json();
      console.log('Login success:', loginData);
      
      // Get session cookie dari response headers
      const setCookieHeader = loginResponse.headers.get('set-cookie');
      console.log('Set-Cookie header:', setCookieHeader);
      
      // Test proposals API dengan session
      console.log('\nTesting proposals API...');
      const proposalsResponse = await fetch('http://localhost:3000/api/pegawai/proposals', {
        method: 'GET',
        headers: {
          'Cookie': setCookieHeader || '',
        }
      });
      
      console.log('Proposals status:', proposalsResponse.status);
      const proposalsData = await proposalsResponse.json();
      console.log('Proposals data:', JSON.stringify(proposalsData, null, 2));
      
    } else {
      const errorData = await loginResponse.json();
      console.log('Login failed:', errorData);
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testLogin();
