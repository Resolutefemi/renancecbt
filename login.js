
function validate() {
    const matricEl = document.getElementById('matric');
    const passEl = document.getElementById('password');
    const matric = matricEl ? matricEl.value.trim() : '';
    const password = passEl ? passEl.value : '';

    if (!matric) {
        alert('Please enter your Matric number');
        return false;
    }
    if (!password) {
        alert('Please enter your password');
        return false;
    }
    return true;
}

function get_getsomething() {
    const el = document.getElementById('login-successful') || document.getElementById('login successful');
    if (el) el.innerText = 'Login successful';
}

