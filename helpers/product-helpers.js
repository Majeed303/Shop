var db=require("../confiq/connection")
var collection=require("../confiq/collection")
var objectId=require('mongodb').ObjectID

module.exports={

    addproduct:(product,callback)=>{
         db.get().collection('product').insertOne(product).then((data)=>{
            callback(data.insertedId)
         })
    },
    getAllProducts:()=>{
         return new Promise (async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
              resolve(products)
         })
    } ,
    deleteproduct:(proId)=>{
       return new Promise((resolve,reject)=>{
           db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(proId)}).then((response)=>{
                            resolve(response)
           })
       })
    },
    getproductdetails:(proId)=>{
      return new Promise((resolve, reject) => {
           db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
          })
      })
    },
    updateproduct:(proId,proDetails)=>{
       return new Promise((resolve,reject)=>{
           db.get().collection(collection.PRODUCT_COLLECTION)
           .updateOne({_id:objectId(proId)},{
                $set:{
                    name:proDetails.name,
                    price:proDetails.price,  
                    category:proDetails.category,
                    brand:proDetails.brand,
                    count:proDetails.count,
                    size: proDetails.size


                }
           }).then((response)=>{
               resolve()
           })
       })
    },
    viewproduct:(proId)=>{
         return new Promise(async(resolve, reject) => {
            await  db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                console.log(product)
                resolve(product)
            })
             
         })
    },
    getfavproduct:(userId)=>{
       return  new Promise(async(resolve, reject) => {

        let faviteams= await db.get().collection(collection.FAV_COLLECTION).aggregate([
            {
                $match: { user: objectId(userId) }
            },
            {
                $unwind: '$products'
            }, {
                $project: {
                    item: '$products.item',
                   
                }
            },
            {
                $lookup: {
                    from: collection.PRODUCT_COLLECTION,
                    localField: 'item',
                    foreignField: '_id',
                    as: 'productes'
                }
            },

            {
                $project: {
                    item: 1, productes: { $arrayElemAt: ["$productes", 0] }
                }
            }
          ]).toArray()
          resolve(faviteams)
        })
    },
    addcoupons:(details)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPONS_COLLECTIONS).insertOne(details).then((response)=>{
                  resolve(response)
            })
        })
    },
    getallcoupons:()=>{
        return new Promise((resolve, reject) => {
           const coupons= db.get().collection(collection.COUPONS_COLLECTIONS).find().toArray()
             resolve(coupons)
        })
    },
    geteditbanner:(proid)=>{
         return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION).findOne({_id:objectId(proid)}).then((response)=>{
                resolve(response)
            })
         })
    },
    editbanner:(details)=>{
        return new Promise((resolve, reject) => {
        db.get().collection(collection.BANNER_COLLECTION).updateOne({_id:objectId(details.id)},{
            $set:{
                tag:details.Tag,
                paragarph:details.description
            }
        }).then((response)=>{
            resolve()
        })
    })
    },

    addbanner: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION).insertOne({
                tag: details.Tag,
                paragarph: details.Paragaph,
                name: details.name,
            }).then((response) => {
                resolve(response.insertedId); // resolve the inserted ID
            }).catch((error) => {
                reject(error);
            });
        });
    }
}
