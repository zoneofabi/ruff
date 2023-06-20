function togglePopUpWindow(){
   
    let window = document.querySelector(".introPopUp");
    window.classList.toggle("introPopUp_HIDDEN");

}

function activateManualWindow() {
    console.log("activate manual window called");
    let window = document.querySelector(".manualWindow_HIDDEN");
    window.classList.toggle("manualWindow");
    

}


function closeManualWindow(){
    console.log("close manual window called");
    let window = document.querySelector(".manualWindow");
    window.classList.toggle("manualWindow_HIDDEN");
    
}