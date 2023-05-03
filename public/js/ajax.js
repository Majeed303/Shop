
function addtobag(proId) {
   var selectedSize = $('.size-circle.active').data('size');
    // Get product ID
     
     var productId = proId;
     
    if (!selectedSize) {
        var messageElem = document.getElementById("message");
        messageElem.innerHTML = "Please select a size ...";
        setTimeout(function() {
        messageElem.innerHTML = "";
        },3000);
      return;
    }
    
    $.ajax({
        url: "/bag" ,
         type: 'POST',
          data: { productId: productId, size: selectedSize },
        success: (response) => {
            if (response.status) {
                $.ajax({
                    url: "/",
                    method: "get",
                    success: (homepageData) => {
                        let count = $(homepageData).find("#cart-count").html();
                        console.log("Current count:", count);
                        count = parseInt(count) + 1;
                        $("#cart-count").html(count);
                    }
                });
                createPopup("Item added to cart");
            }else{
                createPop("Alredy added to cart");
            }
        }
    });
}

function createPopup(message) {
    let popup = document.createElement("div");
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.background = "black";
    popup.style.color = "white";
    popup.style.padding = "20px";
    popup.style.borderRadius = "5px";
    popup.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.3)";
    popup.style.zIndex = "9999";
    popup.innerHTML = "<img src='https://cdn-icons-png.flaticon.com/512/7518/7518748.png' style='float:left; margin-right:10px; width: 50px; height: auto;'> <span style='font-weight:bold; padding-top: 1em;'>" + message + "</span>";
    document.body.appendChild(popup);
    setTimeout(function () {
        popup.parentNode.removeChild(popup);
    }, 2000);
}

function createPop(message) {
    let popup = document.createElement("div");
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.background = "red";
    popup.style.color = "white";
    popup.style.padding = "20px";
    popup.style.borderRadius = "5px";
    popup.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.3)";
    popup.style.zIndex = "9999";
    popup.innerHTML = "<img src='https://cdn-icons-png.flaticon.com/512/190/190406.png' style='float:left; margin-right:10px; width: 50px; height: auto;'> <span style='font-weight:bold; padding-top: 1em;'>" + message + "</span>";
    document.body.appendChild(popup);
    setTimeout(function () {
        popup.parentNode.removeChild(popup);
    }, 2000);
}

