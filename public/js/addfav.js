function addtofav(proid){
             $.ajax({
                url:"/fav/"+proid,
                method:"get",
                  success:(response)=>{
                     if(response.status){
                      $.ajax({
                        url: "/",
                        method: "get",
                        success: (homepageData) => {
                            let count = $(homepageData).find("#fav-count").html();
                            console.log("Current count:", count);
                            count = parseInt(count) ;
                            $("#fav-count").html(count);
                        }
                    });
                      createPopup("Add to fav");
                     }else{
                      createPop("Already Add to fav");
                     }
                    
                    
                  }
             })
           }   
           function createPopup(message) {
            let popup = document.createElement("div");
            popup.style.position = "fixed";
            popup.style.top = "50%";
            popup.style.left = "50%";
            popup.style.transform = "translate(-50%, -50%)";
            popup.style.background = "black";
            popup.style.color = "red";
            popup.style.padding = "20px";
            popup.style.borderRadius = "5px";
            popup.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.3)";
            popup.style.zIndex = "9999";
            popup.innerHTML = "<img src='/images/heart (1).png' style='float:left; margin-right:10px; width: 50px; height: auto;'> <span style='font-weight:bold; padding-top: 1em;'>" + message + "</span>";
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
          popup.style.background = "";
          popup.style.color = "red";
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