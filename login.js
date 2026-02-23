
function validate()
{
    var username=document.getElementById("username").ariaValueMax;
    var password=document.getElementById("password").ariaValueMax;
    if(username==null||username==""){
        alert("Please enter a username");
        return false;
    }
    if(password==null||password==""){
        alert("Please enter a username");
        return false;
    }
    alert("Login Successful");
}
function get_getsomething()
{
    document.getElementById("login successful").innerHTML="Login successful"
}