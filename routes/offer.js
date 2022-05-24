const express = require("express");
const query = require("express/lib/middleware/query");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

const isAuthenticated = require("../middlewares/isAuthenticated");

const Offer = require("../models/Offer");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    // console.log(req.user);
    // console.log(req.fields);
    // console.log(req.files);

    // Destructuring des clefs
    const { title, description, price, condition, city, brand, size, color } =
      req.fields;

    // Création du User
    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [
        {
          MARQUE: brand,
        },
        {
          TAILLE: size,
        },
        {
          ÉTAT: condition,
        },
        {
          COULEUR: color,
        },
        {
          EMPLACEMENT: city,
        },
      ],
      owner: req.user,
      //   product_image: uploadResult, je n'enregistre pas encore l'image
    });
    console.log(newOffer);
    // J'ai créé mon offre donc je peux avoir accès à son futur id en BDD
    // J'upload sur cloudinary dans un dossier qui porte le nom de l'id
    if (req.files?.picture) {
      const uploadResult = await cloudinary.uploader.upload(
        req.files.picture.path,
        {
          folder: `/draco-vinted/offers/${newOffer._id}`,
        }
      );
      newOffer.product_image = uploadResult;
    }

    // Je rajoute l'image reçu depuis cloudinary à ma newOffer

    await newOffer.save();
    // console.log(newOffer);
    res.json(newOffer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// router.get("/offers", async (req, res) => {
// FIND avec une regexp
//   const result = await Offer.find({
//     product_name: new RegExp("test3", "i"),
//   }).select("product_name product_price");

// FIND avec une fourchette de prix
//   $gte = greater than or equal >=
// $lte = lower than or equal <=
//   $gt >
// $lt <

//   const result = await Offer.find({
//     product_price: {
//       $gte: 50,
//       $lte: 150,
//     },
//   }).select("product_name product_price");

// SORT
//   "asc" ou 1 = croissant
// "desc" ou -1 = décroissant
//   const result = await Offer.find()
//     .sort({ product_price: -1 })
//     .select("product_name product_price");

// ON PEUT TOUT CHAINER
//   const result = await Offer.find({
//     product_name: new RegExp("test3"),
//     product_price: {
//       $gte: 50,
//       $lte: 150,
//     },
//   })
//     .sort({ product_price: "desc" })
//     .select("product_name product_price");

//   LIMIT : le nombre de résultat à renvoyer au client
// SKIP : Le nombre de résultats que l'on ignore avant de compter ceux qu'on va renvoyer

//   const result = await Offer.find()
//     .skip(4)
//     .limit(2)
//     .select("product_name product_price");
//   res.json(result);
// });

router.get("/offers", async (req, res) => {
  try {
    const filters = {};
    // Alimenter mon filter en fonction des queries que je reçois
    if (req.query.title) {
      // Ajouter une clef product_name à mon objet qui contiendra un RegExp
      filters.product_name = new RegExp(req.query.title, "i");
    }

    // const regexp = new RegExp(undefined);
    // const str = "salut";
    // console.log(regexp.test(str));

    const obj = {
      product_name: /bleu/,
      product_price: { $lte: 100 },
    };

    if (req.query.priceMin) {
      // console.log(typeof req.query.priceMin);
      filters.product_price = { $gte: Number(req.query.priceMin) };
    }

    if (req.query.priceMax) {
      // Si j'ai déjà une clef product_price, alors je rajoute une clef $lte à l'objet contenu dans product_price
      if (filters.product_price) {
        filters.product_price.$lte = Number(req.query.priceMax);
      } else {
        // Si non, je rajoute une clef product_price à filters qui contiendra { $lte: Number(req.query.priceMax) }
        filters.product_price = { $lte: Number(req.query.priceMax) };
      }
    }

    const sort = {};

    if (req.query.sort === "price-desc") {
      sort.product_price = "desc";
    } else if (req.query.sort === "price-asc") {
      sort.product_price = "asc";
    }

    let limit = 10;
    if (req.query.limit) {
      limit = req.query.limit;
    }

    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const skip = (page - 1) * limit;

    // 10 résultats par page : 1 skip 0, 2 skip 10, 3 skip 20
    // 3 //                   : 1 skip 0, 2 skip 3, 3 skip 6

    const results = await Offer.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("owner", "_id account");
    const count = await Offer.countDocuments(filters);

    console.log(results.length);
    res.json({ count: count, offers: results });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    // console.log(req.params);
    const offer = await Offer.findById(req.params.id)
      .populate("owner", "account")
      .select("product_image.secure_url product_name product_price");
    res.json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
