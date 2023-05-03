var express = require('express');
var router = express.Router();
var productHelpers = require("../helpers/product-helpers")
const userHelpers = require("../helpers/user-helpers")
const otherhelpers = require("../helpers/otherhelpers")

const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect("/login")
  }
}

/* GET home page. */
router.get('/', async function (req, res) {
  let user = req.session.user
  let cartcount = null
  favcount = null
  if (req.session.user) {
    cartcount = await userHelpers.cartcount(req.session.user._id)
    favcount = await userHelpers.favcount(req.session.user._id)
  }
  banner = await userHelpers.getbanners()
  console.log(banner); // Add this line
  productHelpers.getAllProducts().then((products) => {
    res.render("user/homepage.html", { user, products, cartcount, favcount, banner });
  })
});

/* GET home page. */

router.get("/products.html", (req, res) => {
  productHelpers.getAllProducts().then((products) => {
    res.render("user/products.html", { products });
  })
})

router.get("/single-product.html", (req, res) => {
  res.render("user/single-product.html");
})

router.get("/contact.html", (req, res) => {
  res.render("user/contact.html");
})

router.get("/about.html", (req, res) => {
  res.render("user/about.html");
})

router.get("/login", (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/")
  } else {
    res.render("user/login.html", { "loginErr": req.session.loginErr })
    req.session.loginErr = false
  }
})

router.get("/signup", (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/")
  } else {
    res.render("user/signup.html")
  }
})

router.post("/signup",(req, res) => {
   req.session.user = req.body;
  userHelpers.doSignup(req.body).then(async(response) => {
     if(response.status){ 
       res.json(response)
     }else{
      res.json(response)
     }
  })
})

router.get("/otp",async(req,res)=>{
    if(req.session.loggedIn){
        res.redirect("/")
    }else{
      const message = req.query.message || ''; 
   res.render("user/otp.html",{ message: message })
  }
})

router.post("/verify",(req,res)=>{
  let userData = req.session.user;
   const otp=req.body.otp
    console.log("ffff",userData)
   userHelpers.getotp(otp,userData).then((response)=>{
     if(response.status){
      req.session.loggedIn = true; // set the session variable to true
      req.session.user = userData
      res.redirect("/")
     }else{
      res.redirect(`/otp?message=${response.message}`);
     }
  })
})

router.post("/login", (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect("/")
    } else {
      req.session.loginErr = "invalid username or password"
      res.redirect("/login")
    }
  })
})

router.get("/logout", (req, res) => {
  req.session.destroy()
  res.redirect("/")
})

router.post("/bag", verifyLogin, (req, res) => {  
  userHelpers.addToBag(req.body, req.session.user._id).then((response) => { 
      console.log(response)
    res.json(response);
  })
})

router.get("/cart", verifyLogin, async (req, res) => {
  let products = await userHelpers.getproductbag(req.session.user._id)
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  console.log(req.session.user._id)
    console.log(products)
  res.render("user/bag.html", { products, total, user: req.session.user })
})

router.post("/change-product-quantity", verifyLogin, (req, res) => {
    console.log(req.body)
  userHelpers.changeproductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.post('/cartdelete', verifyLogin, (req, res) => {
  console.log(req.body)
  userHelpers.cartdelete(req.body).then((response) => {
    res.json(response)
  })
})

router.get("/placeorder", verifyLogin, async (req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  let address = await userHelpers.getadress(req.session.user._id)
  res.render("user/placeorder.html", { total, user: req.session.user, address })
})

router.get("/viewPage/:id", verifyLogin, async (req, res) => {
  let product = await productHelpers.viewproduct(req.params.id)
  console.log(product)
  res.render("user/View-page.html", { product })
})

router.get("/fav/:id", verifyLogin, (req, res) => {
  userHelpers.addtofav(req.params.id, req.session.user._id).then((response) => {
    console.log(response)
    res.json(response)
  })
})

router.get("/wishlist", verifyLogin, async (req, res) => {
  let product = await productHelpers.getfavproduct(req.session.user._id)
  console.log(product)

  res.render("user/wishlist.html", { product })
})

router.post("/placeorder", verifyLogin, async (req, res) => {
  let product = await userHelpers.getcardproductList(req.body.userid)
  let total=req.body.total;
    console.log(req.body)
  userHelpers.placeOrders(req.body, product,total).then((orderid) => {
    if (req.body['payment-method'] == 'COD') {
      res.json({ result: true })
    } else {
      userHelpers.genraterasorpay(orderid,total).then((response) => {
        res.json(response)
      })
    }


  })
})

router.get("/ordersucess", (req, res) => {
  res.render("user/ordersucess.html")
})

router.get("/profile", verifyLogin, async (req, res) => {
  let user = await userHelpers.getuserdetails(req.session.user._id)
  let address = await userHelpers.getadress(req.session.user._id)
  const message = req.query.message;
  res.render("user/profile.html", { user, address, message})
})

router.post("/profile/edit", verifyLogin,(req, res) => {
  console.log(req.body)
  userHelpers.editprofile(req.body).then(() => {
    res.redirect("/profile")
  })
})

router.get("/orders", verifyLogin, async (req, res) => {
  let orders = await userHelpers.getaadress(req.session.user._id)
  res.render("user/orders.html", { orders })
})

router.post("/changepassword", verifyLogin, (req, res) => {
  console.log(req.body)
  userHelpers.changepassword(req.session.user._id, req.body).then((response) => {
    res.json(response)
  })
})

router.post("/favdelete", verifyLogin, (req, res) => {
  console.log(req.body)
  userHelpers.removefav(req.body).then((response) => {
    res.json(response)
  })
})

router.post("/verifypayment", async (req, res) => {
  const combinedObject = {
    ...req.body.payment,
    ...req.body.order
  };
   console.log(combinedObject)
  await userHelpers.verifypayment(combinedObject).then(() => {

    userHelpers.changepaymentstatus(combinedObject.receipt).then(() => {

      console.log("payment sucess")
      res.json({ status: true })
    })

  }).catch((err) => {
    console.log('err:', err);
    res.json({ status: false, errMsg: '' })
  })
})

router.get("/views-orderproduct/:id", async (req, res) => {
  let product = await userHelpers.getorderproducts(req.params.id)
  res.render("user/view-orders.html", { product })
})

router.get("/orderdelte/:id", (req, res) => {
  userHelpers.ordercancel(req.params.id).then((response) => {
    res.json(response)
  })
})

router.post("/changeaddress", (req, res) => {

  const address = req.body
  const message="require all filed";
  if (
    address.firstname==='' ||
    !address.secondname.trim() ||
    !address.address.trim() ||
    !address.number.trim() ||
    !address.email.trim() ||
    !address.city.trim()
  ) {
    const message = 'Please complete all required fields.';
    res.redirect(`/profile?message=${encodeURIComponent(message)}`);
    return;
  }else{
    userHelpers.editaddress(address).then((response) => {
      const message = 'Address saved successfully!';
      res.redirect(`/profile?message=${encodeURIComponent(message)}`);
    });

  }
});

router.post("/couponcode",async (req,res)=>{
   console.log(req.body)
   let totalprice = await userHelpers.getTotalAmount(req.session.user._id)
   otherhelpers.couponnumber(req.body,totalprice).then((response)=>{
     res.json(response)
  })
})

module.exports = router;
