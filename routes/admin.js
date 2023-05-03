var express = require('express');
const fileUpload = require('express-fileupload');
var router = express.Router();
var productHelpers = require("../helpers/product-helpers")
var userHelpers= require("../helpers/user-helpers")
const multer = require('multer');

const verifyLogin = (req, res, next) => {
  if (req.session.loggedInadmin) {
    next()
  } else {
    res.redirect("/admin/login")
  }
}

/* GET users listing. */

router.get('/', verifyLogin, function(req, res,) {
    res.render('admin/dasboard.html');
});

router.get('/products.html',verifyLogin, async function (req, res) {
 await  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/products.html',{products})
  })
})

router.get('/addproduct',verifyLogin, function (req, res) {
  res.render('admin/addproduct.html')
})

router.post('/addproduct', verifyLogin, function (req, res) {
  console.log(req.body);
  console.log(req.files.image1);

  productHelpers.addproduct(req.body, (id) => {
    let image1 = req.files.image1;
    let image2 = req.files.image2;
    let image3 = req.files.image3;

    if (image1) {
      image1.mv("./public/product-images/" + id + "-1.jpg", (err, done) => {
        if (err) {
          console.log(err);
        }
        if (image2) {
          image2.mv("./public/product-images/" + id + "-2.jpg", (err, done) => {
            if (err) {
              console.log(err);
            }
            if (image3) {
              image3.mv("./public/product-images/" + id + "-3.jpg", (err, done) => {
                if (err) {
                  console.log(err);
                }
                res.render("admin/addproduct.html");
              });
            } else {
              res.render("admin/addproduct.html");
            }
          });
        } else {
          res.render("admin/addproduct.html");
        }
      });
    } else {
      res.status(404).send("No image file was uploaded.");
    }
  });
});


router.get("/user-details",verifyLogin,(req,res)=>{
   userHelpers.getAllUsers().then((users)=>{
    res.render("admin/user-details.html",{users})
   })
})

router.get("/delete-product/:id",verifyLogin,(req,res)=>{
   let proId=req.params.id
   console.log(proId)
    productHelpers.deleteproduct(proId).then((response)=>{
      res.redirect("/admin/products.html")
    })
})

router.get("/edit-product/:id",verifyLogin,async(req,res)=>{
  let product= await productHelpers.getproductdetails(req.params.id)
   res.render('admin/edit-products.html',{product})
})

router.post('/edit-product/:id',verifyLogin, async(req,res)=>{
    console.log(req.body)
    id=req.params.id
    await productHelpers.updateproduct(req.params.id,req.body).then(()=>{
     res.redirect("/admin/products.html")
      if( req.files && req.files.image1){
         let image1=req.files.image1
        image1.mv('./public/product-images/' + id + '-1.jpg',)
      }
      if(req.files && req.files.image2){
        let image2=req.files.image2
       image2.mv('./public/product-images/' + id + '-2.jpg',)
     }
     if(req.files && req.files.image3){
      let image3=req.files.image3
     image3.mv('./public/product-images/' + id + '-3.jpg',)
   }
   })       
})

router.get("/delete-user/:id",verifyLogin, async(req,res)=>{
  userHelpers.deleteUsers(req.params.id).then((response)=>{
        res.redirect("/admin/user-details")
     })
 
})

router.get("/profile",verifyLogin, (req,res)=>{
   res.render("admin/profile.html")
})

router.post("/admin/profile.html",verifyLogin,(req,res)=>{
     userHelpers.getadminprofile(req.body).then((response)=>{
         res.redirect("/admin/profile")
 })
})

router.get("/login",(req,res)=>{
    if(req.session.loggedInadmin){
      res.redirect("/admin")
    }else{
      res.render("admin/login.html",{"loginErr":req.session.loginErr})
       req.session.loginErr=false
    }
    })

router.post("/login",(req,res)=>{ 
   console.log(req.body)
      userHelpers.getadminlogin(req.body).then((response)=>{
            console.log(response)
           if(response.status){
              req.session.loggedInadmin=true
              req.session.admin=response.useradmin
             res.redirect('/admin')
           }else{
            req.session.loginErr="CHEAK YOUR USERNAME AND PASSWORD ?"
             res.redirect("/admin/login",)
           }
      })
})

router.get("/alogout",verifyLogin, (req, res) => {
  req.session.destroy()
  res.redirect("/admin/login")
})

router.get("/block-user/:id",verifyLogin, async(req,res)=>{
  userHelpers.blockUser(req.params.id).then((response)=>{
        res.redirect("/admin/user-details")
     })
})

router.get("/orders", verifyLogin,(req,res)=>{
   userHelpers.getorderdetails().then((orders)=>{
    res.render("admin/orders.html",{orders})
   })
})

router.get("/views-orderproducts/:id",verifyLogin, async(req,res)=>{
   let product=await userHelpers.getorderproducts(req.params.id)
    res.render("admin/vieworderproducts.html",{product})

})

router.get("/delete-order/:id",verifyLogin,async(req,res)=>{
   await userHelpers.deleteorder(req.params.id).then((response)=>{
    res.redirect("/admin/orders")
   })
})

router.get("/coupan",verifyLogin ,async(req,res)=>{
   await productHelpers.getallcoupons().then((coupons)=>{
    console.log(coupons)
   res.render("admin/copons.html",{coupons})
})
})

router.get("/addcopons",(req,res)=>{  
res.render("admin/addcoupons.html")
})


router.post("/addcopons",(req,res)=>{
     productHelpers.addcoupons(req.body).then((response)=>{
      res.render("admin/addcoupons.html")
     })
})

router.get("/delete-coupons/:id",verifyLogin,async(req,res)=>{
    console.log(req.params.id)
  await userHelpers.deletecoupons(req.params.id).then((response)=>{
      res.redirect("/admin/coupan")
  })
})

router.get("/banner",async(req,res)=>{
  await userHelpers.getbanners().then((banner)=>{
     res.render("admin/banner.html",{banner})
   })
 
})

router.get("/editbanner/:id",async(req,res)=>{
    productHelpers.geteditbanner(req.params.id).then((banner)=>{
      res.render("admin/editbanner.html",{banner})
    })
})

router.post("/addbanners",(req,res)=>{
   productHelpers.editbanner(req.body).then(()=>{
    if(req.files && req.files.image1){
      id=req.body.id
      image=req.files.image1
      imagePath='./public/bannerimage/'+id+'.jpg'
      image.mv(imagePath,(err)=>{
          if(err){
              console.log(err)
          }
          res.redirect('/admin/banner')
      })
  }else{
      res.redirect('/admin/banner')
  }
   })
})

router.get("/addbanner",(req,res)=>{
  res.render("admin/addbanner.html")
})

router.post("/addbann",async(req,res)=>{
 await  productHelpers.addbanner(req.body).then((response)=>{
    if(req.files && req.files.image1){
      id=response
      image=req.files.image1
      console.log(id)
      imagePath='./public/bannerimage/'+id+'.jpg'
      image.mv(imagePath,(err)=>{
          if(err){
              console.log(err)
          }
          res.redirect('/admin/banner')
      })
  }else{
      res.redirect('/admin/banner')
  }
   })
})

module.exports = router;
