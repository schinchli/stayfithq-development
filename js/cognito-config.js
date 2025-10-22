// Cognito Configuration for StayFitHQ
const cognitoConfig = {
    region: 'us-east-1',
    userPoolId: 'us-east-1_FrAS1FUzJ',
    clientId: '3f601g1mc0guumjc21rtmde419'
};

// Initialize AWS SDK
AWS.config.region = cognitoConfig.region;
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

// Authentication functions
function authenticateUser(email, password) {
    const params = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: cognitoConfig.clientId,
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password
        }
    };

    return cognitoIdentityServiceProvider.initiateAuth(params).promise();
}

function checkAuthentication() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        redirectToLogin();
        return false;
    }
    
    // Verify token is still valid
    const params = {
        AccessToken: token
    };
    
    cognitoIdentityServiceProvider.getUser(params).promise()
        .then(data => {
            console.log('User authenticated:', data.Username);
        })
        .catch(err => {
            console.log('Token invalid, redirecting to login');
            redirectToLogin();
        });
    
    return true;
}

function redirectToLogin() {
    if (window.location.pathname !== '/login.html') {
        window.location.href = '/login.html';
    }
}

function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('idToken');
    redirectToLogin();
}

// Protect all pages except login
if (window.location.pathname !== '/login.html') {
    document.addEventListener('DOMContentLoaded', function() {
        checkAuthentication();
    });
}
