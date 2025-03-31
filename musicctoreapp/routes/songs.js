const {ObjectId} = require("mongodb");
module.exports=function (app, songsRepository, commentsRepository){
    app.get("/songs", function(req,res){
        let songs =[{
           "title":"Blank space",
           "price":"1.2"
        },{
            "title":"See you again",
            "price":"1.3"
        },{
            "title":"Uptown Funk",
            "price":"1.1"
        }];

        let response = {
            seller: 'Tienda de canciones',
            songs:songs
        };
        res.render("shop.twig",response);
    });
    app.get("/shop", function (req,res){

        let filter={};
        let options ={sort:{title:1}};

        if(req.query.search != null && typeof (req.query.search) != "undefined" && req.query.search !== ""){
            filter = {"title": {$regex: ".*" + req.query.search + ".*"}};
        }

        let page = parseInt(req.query.page);
        if(typeof req.query.page ==="undefined" || req.query.page === null || req.query.page === '0'){
            page = 1;
        }
       songsRepository.getSongsPg(filter,options, page).then(result=>{
           let lastPage = result.total / 4;
           if(result.total % 4 > 0){
               lastPage = lastPage+1;
           }
           let pages = [];
           for (let i = page -2; i <= page+2; i++){
               if(i>0 && i<=lastPage){
                   pages.push(i);
               }
           }
           let response = {
               songs : result.songs,
               pages: pages,
               currentPage: page
           }
           res.render("shop.twig", response);
       }).catch(error=>{
           res.redirect("/error" +
               "?message="+"Se ha producido un error al listar las canciones "+error+
               "&messageType=alert-danger");
           //res.send("Se ha producido un error al listar las canciones "+error);
       });
    });

    app.get('/add', function(req, res) {
        let response = parseInt(req.query.num1) + parseInt(req.query.num2);
        res.send(String(response));
    });

    app.get('/songs/add', function(req, res) {

        res.render("songs/add.twig");
    });

    app.get('/publications', function (req, res) {
        let filter = {author : req.session.user};
        let options = {sort: {title: 1}};
        songsRepository.getSongs(filter, options).then(songs => {
            res.render("publication.twig", {songs: songs});
        }).catch(error => {
            res.redirect("/error" +
                "?message="+"Se ha producido un error al listar las publicaciones del usuario:"+error+
                "&messageType=alert-danger");
            //res.send("Se ha producido un error al listar las publicaciones del usuario:" + error)
        });
    })




    app.post('/songs/add', function (req,res){

        let song = {
            title: req.body.title,
            kind: req.body.kind,
            price: req.body.price,
            author:req.session.user
        }
        songsRepository.insertSong(song, function(result){
            if(result.songId !== null && result.songId !== undefined){
                if(req.files != null){
                    let image=req.files.cover;
                    image.mv(app.get("uploadPath")+"/public/covers/"+result.songId+".png")
                        .then(()=> {
                            if(req.files.audio != null){
                                let audio = req.files.audio;
                                audio.mv(app.get("uploadPath")+"/public/audios/"+result.songId+".mp3")
                                    .then(res.redirect("/publications"))
                                    .catch(error=> {
                                        res.redirect("/error" +
                                            "?message="+"Error al subir el audio de la canción :"+result.error+
                                            "&messageType=alert-danger");
                                        //res.send("Error al subir el audio de la canción")
                                        });
                            }else{
                                res.redirect("/publications");
                            }
                        })
                        .catch(error=>{
                            res.redirect("/error" +
                                "?message="+"Error al subir la portada de la canción :"+error+
                                "&messageType=alert-danger");
                            //res.send("Error al subir la portada de la canción")
                            });
                }else{
                    res.redirect("/publications");
                }
            }else{
                res.redirect("/error" +
                    "?message="+"Error al insertar canción :"+result.error+
                    "&messageType=alert-danger");
                //res.send("Error al insertar canción :"+result.error);
            }
        })
    });

    app.get("/songs/edit/:id" ,function (req, res){
       let filter = {_id: new ObjectId(req.params.id)};
       songsRepository.findSong(filter, {}).then(song=>{
           res.render("songs/edit.twig", {song: song});
       }).catch(error=>{
           res.redirect("/error" +
               "?message="+"Se ha producido un error al recuperar la canción "+
               "&messageType=alert-danger");
           //res.send("Se ha producido un error al recuperar la canción "+error);
       });
    });

    app.post("/songs/edit/:id", function (req, res){
        let song = {
            title: req.body.title,
            kind: req.body.kind,
            price: req.body.price,
            author: req.session.user
        }

        let songId = req.params.id;
        let filter = {_id:new ObjectId(songId)};
        //que no se cree un documento nuevo si no existe
        const options = {upsert:false}
        songsRepository.updateSong(song, filter, options).then(result=>{
            step1UpdateCover(req.files, songId, function (result){
                if(result==null){
                    res.redirect("/error" +
                        "?message="+"Error al actualizar la portada o el audio de la canción"+
                        "&messageType=alert-danger");
                    //res.send("Error al actualizar la portada o el audio de la canción");
                }else{
                    res.redirect("/publications");
                }
            });
        }).catch(error=>{
            res.redirect("/error" +
                "?message="+"Se ha producido un error al modificar la canción "+error+
                "&messageType=alert-danger");
            //res.send("Se ha producido un error al modificar la canción "+error);
        })
    });

    function step1UpdateCover(files, songId, callback){
        if(files && files.cover != null){
            let image = files.cover;
            image.mv(app.get("uploadPath")+"/public/covers/"+songId+".png", function (err){
                if(err){
                    callback(null);
                }else{
                    step2UpdateAudio(files, songId, callback); //Siguiente
                }
            });
        }else{
            step2UpdateAudio(files, songId, callback); //Siguiente
        }
    }

    function step2UpdateAudio(files, songId, callback){
        if(files && files.audio != null){
            let audio = files.audio;
            audio.mv(app.get("uploadPath") + '/public/audios/' + songId + '.mp3', function (err) {
                if (err) {
                    callback(null); // ERROR
                } else {
                    callback(true); // FIN
                }
            });
        } else {
            callback(true); // FIN
        }
    }

    app.get("/songs/delete/:id", function (req,res){
       let filter = {_id:new ObjectId(req.params.id)};
       songsRepository.deleteSong(filter, {}).then(result=>{
           if(result===null || result.deletedCount ===0){
               res.redirect("/error" +
                   "?message="+"No se ha podidio eliminar el registro "+
                   "&messageType=alert-danger");
               //res.send("No se ha podido eliminar el registro");
           }else{
               res.redirect("/publications");
           }
       }).catch(error=>{
           res.redirect("/error" +
               "?message="+"Se ha producido un error al intentar eliminar la canción "+error+
               "&messageType=alert-danger");
           //res.send("Se ha producido un error al intentar eliminar la canción: "+error);
       })
    });

    app.post("/songs/buy/:id", function (req, res){
       let songId = new ObjectId(req.params.id);

       let filter = {_id: songId};

       songsRepository.findSong(filter, {}).then(song=>{

           if(song.author === req.session.user){
                //res.send("Eres el autor de la canción");
               res.redirect("/error" +
                   "?message="+"Eres el autor de la canción"+
                   "&messageType=alert-danger");
           }else{

               filter = {song_id: songId, user: req.session.user};

                songsRepository.getPurchases(filter, {}).then(purchasedIds=>{
                    if(purchasedIds.length > 0){
                        //res.send("Ya has comprado esta canción");
                        res.redirect("/error" +
                            "?message="+"Ya has comprado esta canción"+
                            "&messageType=alert-danger");
                    }else{
                        let shop = {
                            user: req.session.user,
                            song_id : songId
                        }
                        songsRepository.buySong(shop).then(result=>{
                            if(result.insertedId === null || typeof (result.insertedId) === undefined){
                                res.redirect("/error" +
                                    "?message="+"Se ha producido un error al comprar la canción"+
                                    "&messageType=alert-danger");
                                //res.send(("Se ha producido un error al comprar la canción"));
                            }else{
                                res.redirect("/purchases");
                            }
                        }).catch(error=>{
                            res.redirect("/error" +
                                "?message="+"Se ha producido un error al comprar la canción"+error+
                                "&messageType=alert-danger");
                            //res.send("Se ha producido un error al comprar la canción "+error);
                        });
                    }
                }).catch(error=>{
                    res.redirect("/error" +
                        "?message="+"Se ha producido un error al comprar la canción"+error+
                        "&messageType=alert-danger");
                    //res.send("Se ha producido un error al comprar la canción "+error);
                });
           }

       }).catch(error=>{
           res.redirect("/error" +
               "?message="+"Se ha producido un error al comprar la canción"+error+
               "&messageType=alert-danger");
           //res.send("Se ha producido un error al comprar la canción "+error);
       });

    });

    app.get("/purchases", function (req, res){
       let filter = {user: req.session.user};
       let options = {projection: {_id:0, song_id:1}};
       songsRepository.getPurchases(filter, options).then(purchasedIds =>{
           const purchasedSongs = purchasedIds.map(song=>song.song_id);
           let filter = {"_id": {$in: purchasedSongs}};
           let options = {sort: {title:1}};
           songsRepository.getSongs(filter, options).then(songs =>{
               res.render("purchase.twig", {songs:songs});
           }).catch(error=>{
               res.redirect("/error" +
                   "?message="+"Se ha producido un error al listar las publicaciones del usuario "+error+
                   "&messageType=alert-danger");
               //res.send("Se ha producido un error al listar las publicaciones del usuario "+error);
           });
       }).catch(error=>{
           res.redirect("/error" +
               "?message="+"Se ha producido un error al listar las canciones del usuario "+error+
               "&messageType=alert-danger");
           //res.send("Se ha producido un error al listar las canciones del usuario "+error);
       });
    });

    app.get('/songs/:id', function(req, res) {
        let filter = {_id: new ObjectId(req.params.id)};
        let options={};
        let user = req.session.user;
        songsRepository.findSong(filter, options).then(song =>{

            filter = {song_id: new ObjectId(req.params.id)};

            let isAuthor = req.session.user === song.author;
            let hasBought = false;

            let purchaseFilter = {song_id: new ObjectId(req.params.id),
                user: req.session.user};

            songsRepository.getPurchases(purchaseFilter, {}).then(purchasedIds=>{
                hasBought = purchasedIds.length !== 0;
                commentsRepository.getComments(filter, options).then(comments=>{
                    let settings = {
                        url: "https://api.currencyapi.com/v3/latest?apikey=cur_live_oOnhjjtFoWIVO0IhJRs0JgyB1rzEoo6z5sUpzbSw&base_currency=EUR&currencies=USD",
                        method: "get",
                    }
                    let rest = app.get("rest");
                    rest(settings, function (error, response, body){
                        console.log("cod: "+response.statusCode+" Cuerpo: "+body);
                        let responseObject = JSON.parse(body);
                        let rateUDS = responseObject.data.USD.value;
                        let songValue = song.price/rateUDS;
                        song.usd = Math.round(songValue*100)/100;

                        res.render("songs/song.twig", {song:song, comments:comments, isAuthor:isAuthor, hasBought:hasBought});
                    })

                }).catch(error=>{
                    res.redirect("/error" +
                        "?message="+"Se ha producido un error al buscar los comentarios "+error+
                        "&messageType=alert-danger");
                    //res.send("Se ha producido un error al buscar los comentarios "+error)
                })
            }).catch(error=>{
                res.redirect("/error" +
                    "?message="+"Se ha producido un error al buscar la canción "+error+
                    "&messageType=alert-danger");
                //res.send("Se ha producido un error al buscar la canción "+error)
            })




        }).catch(error=>{
            res.redirect("/error" +
                "?message="+"Se ha producido un error al buscar la canción "+error+
                "&messageType=alert-danger");
            //res.send("Se ha producido un error al buscar la canción "+error);
        })
    });

    app.get('/songs/:kind/:id', function(req, res) {
        let response = 'id: ' + req.params.id + '<br>'
            + 'Tipo de música: ' + req.params.kind;
        res.send(response);
    });

    app.get('/promo*', function (req, res) {

        res.send('Respuesta al patrón promo*');
    });

    app.get('/pro*ar', function (req, res) {
        res.send('Respuesta al patrón pro*ar');
    });

    app.get('/ab?cd', (req, res) => {
        res.send('ab?cd')
    });

    app.get('/ab+cd', (req, res) => {
        res.send('ab+cd')
    });

    app.get('/ab*cd', (req, res) => {
        res.send('ab*cd')
    });

    app.get('/ab(cd)?e', (req, res) => {
        res.send('ab(cd)?e')
    });

    /*
    app.get(/a/, (req, res) => {
        res.send('/a/')
    });*/

    app.get(/.*fly$/, (req, res) => {
        res.send('/.*fly$/')
    });
};

