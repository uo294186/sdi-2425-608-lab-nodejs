const {ObjectId} = require("mongodb");
module.exports=function(app, favoriteSongsRepository){

    //song_id, date, price (parseFloat), title, user, _id

    app.get("/songs/favorites", function (req,res){
        //Get lista y calc precio total. Realizar enrutador funcion adecuada
        //Generar y devolver songs/favorites.twig con las favs y el precio

        let filter = {};
        let options = {sort:{title:1}};

        favoriteSongsRepository.getFavorites(filter,options).then(favorites=>{

            let totalPrice = 0;
            favorites.map(fav=>totalPrice+=fav.price);

            res.render("songs/favorites.twig", {favorites:favorites, totalPrice:totalPrice});
        }).catch(error=>{
            res.send("Se ha producido un error al listar los favoritos "+error);
        })

    });

    app.post("/songs/favorites/add/:song_id", function (req,res){

        //formulario en shop.twig

        let favorite = {
            song_id: new ObjectId(req.params.song_id),
            date: new Date().toLocaleDateString('es-ES'),
            price : parseFloat(req.body.price),
            title: req.body.title,
            user: req.session.user
        }
        favoriteSongsRepository.insertFavorite(favorite, function(result){
            if(result.favoriteId !== null && result.favoriteId !== undefined){
                res.send("Canción añadida a favoritos: "+result.favoriteId);
            }else{
                res.send("Error al insertar la canción en favoritos "+result.error);
            }
        });


    });

    app.get("/songs/favorites/delete/:song_id", function (req, res){
        let filter = {song_id: new ObjectId(req.params.song_id)};

        favoriteSongsRepository.deleteFavorite(filter, {}).then(()=>{
            res.send("Canción eliminada de favoritos con exito");
        }).catch(error=>{
            res.send("Error eliminando canción de favoritos "+error)
        })

    });

}