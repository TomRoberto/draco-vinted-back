const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    //   Vérifier que j'ai bien un token qui m'est envoyé
    if (req.headers.authorization) {
      // Vérifier si ce token est bien celui d'un utilisateur
      const token = req.headers.authorization.replace("Bearer ", "");
      // Je vais chercher mon user mais je ne sélectionne que ses clefs account et _id
      const user = await User.findOne({ token: token }).select("account _id");
      if (user) {
        req.user = user;
        next();
        // Passer à la suite
      } else {
        res.status(401).json({ message: "Unauthorized 2" });
      }
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
