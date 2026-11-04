if(sessionStorage.getItem("loggedIn")){
    window.location.href = "dashboard.html";
}

const loginForm =
document.getElementById("loginForm");

loginForm.addEventListener("submit", function(e){

    e.preventDefault();

    const username =
    document.getElementById("username").value;

    const password =
    document.getElementById("password").value;

    const company =
    JSON.parse(
        localStorage.getItem("sdjCompany")
    );

    if(!company){

        alert(
            "No company account found."
        );

        window.location.href =
        "register.html";

        return;
    }

    if(
        username === company.username &&
        password === company.password
    ){

        sessionStorage.setItem(
            "loggedIn",
            "true"
        );

        window.location.href =
        "dashboard.html";

    }else{

        alert(
            "Invalid username or password."
        );

    }

});