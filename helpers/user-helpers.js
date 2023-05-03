var db = require("../confiq/connection")
var collection = require("../confiq/collection")
const bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectID
const Razorpay = require('razorpay')

require('dotenv').config();

const twilio = require('twilio');
const servicesid='VAf79c4435d887de549cda931a054c99a9'
const accountSid = process.env.MY_VARIABLE_NAME;
const authToken =  process.env.MY_VARIABLE_second;
const client= require('twilio')(accountSid, authToken);
const twilioClient = client.verify.services(servicesid).v2;
const readline = require('readline');
const ejs = require('ejs');

var instance = new Razorpay({
    key_id:process.env.MY_VARIABLE_key_id ,
    key_secret:process.env.MY_VARIABLE_key_secret ,
});

module.exports = {

    doSignup: (userData, req) => {
        return new Promise(async (resolve, reject) => {
          try {
            let user = await db
              .get()
              .collection(collection.USER_COLLECTION)
              .findOne({ username: userData.username });
            if (user) {
              let response = {
                status: false,
                message: 'Username already exists',
              };
              resolve(response);
            } else {
              const otpResponse = await client.verify.v2
                .services('VAf79c4435d887de549cda931a054c99a9')
                .verifications.create({
                  to:`+91${userData.number}`,
                  channel: 'sms',
                })
              let response = {
                status: true,
              };
              resolve(response);
            }
          } catch (err) {
            console.log(err);
            let response = {
              status: false,
              message: err.message,
            };
            resolve(response);
          }
        });
      },
      

      getotp: (otp, userData) => {
        return new Promise(async (resolve, reject) => {
          try {
            // Check if the OTP is correct
            const verificationResult = await client.verify.v2.services('VAf79c4435d887de549cda931a054c99a9').verificationChecks.create({
              to: `+91${userData.number}`,
              code: otp,
            });
            if (verificationResult.status !== 'approved') {
              const response = {
                status: false,
                message: 'Incorrect OTP. Please try again.',
              };
              resolve(response);
            } else {
              const response = {}; // define the response object
              // Encrypt the user password
              const salt = await bcrypt.genSalt(10);
              const hash = await bcrypt.hash(userData.password, salt);
              userData.password = hash;
              // Insert the user details to the database
              const result = await db.get().collection(collection.USER_COLLECTION).insertOne(userData);
              // Mark the user as verified
              response.status = true;
              resolve(response);
            }
          } catch (error) {
            console.error(error);
            const response = {
              status: false,
              message: 'An error occurred. Please try again .',
            };
            resolve(response);
          }
        });
      },
      
    
      
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ username: userData.username })
            if (user) {
                const status = await bcrypt.compare(userData.password, user.password);
                    if (status) {
                        console.log("lofin")
                        response.user = user
                        response.status = true
                        resolve(response)
                    }
                    else {
                        console.log("not ready")
                        resolve({ status: false })
                    }
            } else {
                console.log("login failed")
                resolve({ status: false })
            }
        })
    },

    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },

    deleteUsers: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).removeOne({ _id: objectId(proId) }).then((response) => {
                resolve(response)
            })
        })
    },

    addToBag: (product, userId) => {
         let  proId=product.productId;
        let proObj = {
            item: objectId(proId),
            quantity: 1,
            size:[product.size],
        }
        return new Promise(async (resolve, reject) => {

            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            

            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId  && product.size == product.size )
                
                if (proExist != -1 ) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), "products.item": objectId(proId) ,"products.size": product.size},
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then((response) => {
                            resolve({status:false, message:"Already added to cart"})
                        })

                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {

                                $push: { products: proObj}

                            }
                        ).then((response) => {
                            resolve({status:true, message:"Iteam added to cart"})
                        })
                }

            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve({status:true, message:"Iteam added to cart"})
                })
            }
        })

    },

    getproductbag: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        size: '$products.size'
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
                        item: 1, quantity: 1,size:1, productes: { $arrayElemAt: ["$productes", 0] }
                    }
                }
            ]).toArray()
            resolve(cartItems)
        })
    },

    cartcount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeproductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
          console.log("?",details.quantity)

        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }
                ).then((response) => {
                    resolve({ removeproduct: true })
                })

            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }
                    ).then((response) => {
                        resolve({ status: true })
                    })
            }
        })
    },

    cartdelete: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.prod) } }
                    }
                )


                .then((response) => {
                    resolve({ removeproduct: true })
                })
        })
    },

    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
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
                        item: 1, quantity: 1, productes: { $arrayElemAt: ["$productes", 0] }
                    }
                },

                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', { $toInt: '$productes.price' }] } }
                    }
                }
            ]).toArray()
            if (total == 0) {
                resolve("0")
            } else
                resolve(total[0].total)
        })

    },

    placeOrders: async (order, products,total) => {
        return new Promise((resolve, reject) => {
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliverydetails: {
                    firstname: order.name1,
                    secondname: order.name2,
                    adress: order.adress,
                    number: order.number,
                    email: order.email,
                    city: order.city,
                    date: new Date()
                },
                userId: objectId(order.userid),
                paymentMethod: order['payment-method'],
                products: products,
                status: status,
                total: total
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then(async(response) => {
                db.get().collection(collection.CART_COLLECTION).removeOne({ user: objectId(order.userid) })

                let newCollectionObj = {
                    deliverydetails: {
                    firstname: order.name1,
                    secondname: order.name2,
                    adress: order.adress,
                    number: order.number,
                    email: order.email,
                    city: order.city,
                    },
                    userId: objectId(order.userid),
                }
                let address=await db.get().collection(collection.ADDRESS_COLLECTION).findOne({userId:objectId(newCollectionObj.userId)})
                if(address){
                      console.log("kkk")
                }else{
                db.get().collection(collection.ADDRESS_COLLECTION).insertOne(newCollectionObj).then(() => {
                    resolve();
                })
                }
                resolve(response.insertedId)
            })
        })
    },

    getcardproductList: (userId) => {
        console.log(userId)
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })

            if (cart) {
                resolve(cart.products)
            } else {
                resolve("no products")
            }


        })
    },

    getadminprofile: (details) => {
        return new Promise(async (resolve, reject) => {
            console.log(details.password)
            details.password = await bcrypt.hash(details.password, 10)
            db.get().collection(collection.ADMIN_COLLECTION).insertOne(details).then((data) => {
                resolve(data.insertedId)
            })
        })
    },
    getadminlogin: (userdetails) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ fullName: userdetails.username })
            if (user) {
                bcrypt.compare(userdetails.password, user.password).then(async(status) => {
                    if (status) {
                        response.useradmin = user
                        response.status = true
                        console.log("yes")
                        resolve(response)

                    } else {
                        let adminCount = await db.get().collection(collection.ADMIN_COLLECTION).countDocuments({});
                        if (adminCount === 0) {
                       response.useradmin = user
                        response.status = true
                        console.log("null")
                        resolve(response)
                          } else {
                        console.log("1")
                        resolve({status:false})
                          }
                    }
                })
            } else {
                let adminCount = await db.get().collection(collection.ADMIN_COLLECTION).countDocuments({});
                        if (adminCount === 0) {
                       response.useradmin = user
                        response.status = true
                        console.log("null")
                        resolve(response)
                          } else {
                        console.log("2")
                        resolve({status:false})
                          }
                    }
        })
    },

    getadress: async (userId) => {
        return new Promise(async (resolve, reject) => {
            let adress = await db.get().collection(collection.ADDRESS_COLLECTION)
                .find({ userId: objectId(userId) }).toArray()
            console.log(adress)
            resolve(adress)
        })
    },

    getaadress: async (userId) => {
        return new Promise(async (resolve, reject) => {
            let adress = await db.get().collection(collection.ORDER_COLLECTION)
                .find({ userId: objectId(userId) }).toArray()
            console.log(adress)
            resolve(adress)
        })
    },

    editprofile: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: objectId(details.userid) }, {

                    $set: {
                   
                        username: details.name,
                        email: details.email,

                    }
                }).then((response) => {
                    resolve()
                })


        })
    },

    getuserdetails: (userid) => {
        return new Promise(async (resolve, reject) => {
            let userdetails = await db.get().collection(collection.USER_COLLECTION)
                .find({ _id: objectId(userid) }).toArray()
            console.log(userdetails)
            resolve(userdetails)
        })
    },

    blockUser: (userid) => {
        let blocked = null;
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userid) })

            if (user) {

                await db.get().collection(collection.USER_COLLECTION)
                    .updateOne(
                        { _id: objectId(userid) },
                        { $set: { blocked: true } }
                    );
                resolve(true);

            }
        })
    },

    changepassword: (userid, details) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userid) })

            if (user) {
                bcrypt.compare(details.password, user.password).then((status) => {
                    if (status) {
                        const saltRounds = 10;

                        bcrypt.hash(details.newPassword, saltRounds, function (err, hashedPassword) {
                            if (err) {
                                console.log(err);
                            } else {
                                db.get().collection(collection.USER_COLLECTION)
                                    .updateOne({ _id: objectId(userid) }, {
                                        $set: {
                                            password: hashedPassword
                                        }
                                    }).then((response) => {
                                        resolve({ addnewpassword: true });
                                    });
                            }
                        });
                    } else {
                        resolve({ addnewpassword: false });
                    }
                });
            } else {
                reject();
            }
        });
    },

    addtofav: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
        }
        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection(collection.FAV_COLLECTION).findOne({ user: objectId(userId) })

            if (user) {
                let proExist = user.products.findIndex(product => product.item.toString() === proId.toString())

                if (proExist !== -1) {
                    resolve({ status: false })
                } else {

                    db.get().collection(collection.FAV_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: { products: proObj }

                        }
                    ).then((response) => {
                        resolve({ status: true })
                    })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj],
                }
                db.get().collection(collection.FAV_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve({ status: true })
                })
            }
        })
    },
    favcount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.FAV_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })

    },
    removefav: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.FAV_COLLECTION).updateOne({ _id: objectId(details.fav) },
                {
                    $pull: { products: { item: objectId(details.proid) } }
                }
            )
                .then((response) => {
                    resolve({ removefav: true })
                })
        })
    },

    getorderdetails: (userid) => {
        return new Promise((resolve, reject) => {
            let orders = db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orders)
        })
    },

    getorderproducts: (orderid) => {
        return new Promise(async (resolve, reject) => {
            let orderiteam = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderid) }
                },
                {
                    $unwind: "$products"
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        size:"$products.size"
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, size:1    , product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            console.log(orderiteam)
            resolve(orderiteam)
        })
    },
    deleteorder: (orderid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).removeOne({ _id: objectId(orderid) }).then((response) => {
                resolve(response)
            })
        })
    },
    genraterasorpay: (orderid, total) => {
        return new Promise((resolve, reject) => {
            console.log("order:", orderid)

            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderid,
            }
            instance.orders.create(options, function (err, orders) {
                if (err) {
                    console.log("err", err)
                } else {
                    console.log("orders:", orders)
                    resolve(orders)

                }

            });
        })
    },

    verifypayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'X1ZQVerJe5OZF2es3A5MSXNN')

            hmac.update(details.razorpay_order_id + '|' + details.razorpay_payment_id);

            const hmacResult = hmac.digest('hex');
            if (hmacResult == details.razorpay_signature) {
                resolve()
            } else {
                reject()
            }
        })
    },

    changepaymentstatus: (orderid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderid) },
                    {
                        $set: {
                            status: 'placed'
                        }
                    }
                ).then(() => {
                    resolve()
                })
        })
    },
    deletecoupons: (coupid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPONS_COLLECTIONS).removeOne({ _id: objectId(coupid) }).then((response) => {
                resolve(response)
            })
        })
    },

    ordercancel: (orderid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).removeOne({ _id: objectId(orderid) }).then((response) => {
                resolve({ status: true })
            })
        })
    },

    getbanners: () => {
        return new Promise(async (resolve, reject) => {
            const banner = await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
            resolve(banner)
        })
    },

    editaddress: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ userId: objectId(details.userid) }, {
                $set: {
                    deliverydetails: {
                        firstname: details.firstname,
                        secondname: details.secondname,
                        adress: details.address,
                        number: details.number,
                        email: details.email,
                        city: details.city,
                    }
                }
            }).then((response) => {
                resolve(response)
            })
        })
    }

}

