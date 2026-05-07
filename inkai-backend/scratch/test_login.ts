import axios from 'axios';

async function testLogin() {
  const url = 'http://127.0.0.1:5001/v1/auth/login';
  try {
    console.log('Testing login with correct email: rahmanh946@gmail.com');
    const response = await axios.post(url, {
      identifier: 'rahmanh946@gmail.com',
      password: 'password123' // I'll guess a common password or check backend code for defaults
    });
    console.log('Login Result:', response.data);
  } catch (error: any) {
    console.log('Login Error:', error.response?.data || error.message);
  }
}

testLogin();
