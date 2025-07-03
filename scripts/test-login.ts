import { NextApiRequest, NextApiResponse } from 'next'

// Simple test script to login via API
async function testLogin() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nip: 'test123',
        password: 'password',
        userType: 'pegawai'
      })
    })

    console.log('Login Response Status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('Login Success:', data)
      
      // Now test the proposals API with cookies
      const proposalsResponse = await fetch('http://localhost:3000/api/pegawai/proposals', {
        headers: {
          'Cookie': response.headers.get('Set-Cookie') || ''
        }
      })
      
      console.log('Proposals Response Status:', proposalsResponse.status)
      
      if (proposalsResponse.ok) {
        const proposalsData = await proposalsResponse.json()
        console.log('Proposals Data:', proposalsData)
      } else {
        const errorText = await proposalsResponse.text()
        console.log('Proposals Error:', errorText)
      }
      
    } else {
      const errorText = await response.text()
      console.log('Login Error:', errorText)
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testLogin()
