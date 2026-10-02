function addTask() {
            let newTask = document.getElementById("task").value;

            document.getElementById("list").innerHTML +=
                newTask + "<br>";
              
        }
        function Delete(){
            document.getElementById("list").innerHTML = "";
        }