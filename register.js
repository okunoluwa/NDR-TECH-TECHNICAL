// Redirect to login if company already exists

const existingCompany =
JSON.parse(localStorage.getItem("sdjCompany"));

if(existingCompany){
    window.location.href = "login.html";
}

const form =
document.getElementById("registerForm");

form.addEventListener("submit", function(e){

    e.preventDefault();

    const companyName =
    document.getElementById("companyName").value;

    const ownerName =
    document.getElementById("ownerName").value;

    const phone =
    document.getElementById("phone").value;

    const email =
    document.getElementById("email").value;

    const username =
    document.getElementById("username").value;

    const password =
    document.getElementById("password").value;

    const confirmPassword =
    document.getElementById("confirmPassword").value;

    if(password !== confirmPassword){

        alert("Passwords do not match.");
        return;
    }

    const company = {
        companyName,
        ownerName,
        phone,
        email,
        username,
        password
    };

    localStorage.setItem(
        "sdjCompany",
        JSON.stringify(company)
    );

    localStorage.setItem(
        "tickets",
        JSON.stringify([])
    );

    localStorage.setItem(
        "technicians",
        JSON.stringify([])
    );

    localStorage.setItem(
        "finances",
        JSON.stringify([])
    );

    sessionStorage.setItem(
        "loggedIn",
        "true"
    );

    window.location.href =
    "dashboard.html";

});