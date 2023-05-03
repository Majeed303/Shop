var db=require("../confiq/connection")
var collection=require("../confiq/collection")
var objectId=require('mongodb').ObjectID

module.exports={
         
    couponnumber:(details,totalprice)=>{
        return new Promise(async(resolve, reject) => {
           let found =await db.get().collection(collection.COUPONS_COLLECTIONS).findOne({name:details.couponCode})
           if(found){
                let count =found.purprice
                let price=found.price
                if(totalprice>=count){
                    totalprice -= price
                     resolve({status:true,totalprice:totalprice, })
                }else{
                     resolve({status:false , message: "Please purchase more."})
                }
              
           }else{
               resolve({status:false , message: "The promotional code you entered is not valid."})
           }
        })
    },

    


    


}