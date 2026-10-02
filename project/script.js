// Dark Mode
function toggleMode() {
    document.body.classList.toggle("dark");
}

// Contact Form
function sendMessage() {
    let name = document.getElementById("name").value;

    if(name==""){
        alert("Please enter your name");
    }
    else{
        alert("Thank you " + name + "! Message Sent Successfully.");
    }
}

// Typing Animation
let text = [
    "B.Tech IT Student",
    "Java Developer",
    "Future Software Tester",
    "Problem Solver"
];

let i = 0;

function changeText(){
    document.getElementById("typing").innerHTML = text[i];

    i++;

    if(i == text.length){
        i = 0;
    }
}

setInterval(changeText,2000);

changeText();