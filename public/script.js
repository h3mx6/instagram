document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Basic validation
            if (!username || !password) {
                alert('Please fill in all fields');
                return;
            }
            
            // Show loading state
            const loginBtn = document.querySelector('.login-btn');
            const originalText = loginBtn.textContent;
            loginBtn.textContent = 'Logging in...';
            loginBtn.disabled = true;
            
            try {
                console.log('Sending login request...');
                
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ 
                        username: username.trim(), 
                        password: password.trim() 
                    })
                });
                
                console.log('Response status:', response.status);
                
                // Check if response is OK
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Error response:', errorText);
                    throw new Error(`Server responded with status ${response.status}`);
                }
                
                // Parse JSON response
                const data = await response.json();
                console.log('Response data:', data);
                
                if (data.success) {
                    // Show success message
                    alert('Login successful!');
                    
                    // Optional: Redirect to Instagram
                    // window.location.href = 'https://www.instagram.com';
                    
                    // Clear form
                    loginForm.reset();
                } else {
                    alert(data.message || 'Login failed. Please try again.');
                }
                
            } catch (error) {
                console.error('Detailed error:', error);
                
                // Show user-friendly error message
                if (error.message.includes('Failed to fetch')) {
                    alert('Cannot connect to server. Please check if server is running.');
                } else if (error.message.includes('JSON')) {
                    alert('Server error. Please try again later.');
                } else {
                    alert('An error occurred. Please try again.');
                }
                
            } finally {
                // Reset button state
                loginBtn.textContent = originalText;
                loginBtn.disabled = false;
            }
        });
    }
});