const express = require('express');
const userFavoritesRouter = express.Router();
userFavoritesRouter.use(function(req, res, next) {
    console.log("routerUsuarioFavorites");
    if ( req.session.user ) {
        // dejamos correr la petición
        next();
    } else {
        console.log("va a: " + req.originalUrl);
        res.redirect("/users/login");
    }
});
module.exports = userFavoritesRouter;
