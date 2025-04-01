const {ObjectId} = require("mongodb");
module.exports = function (app, songsRepository, usersRepository){
    app.get("/api/v1.0/songs", function (req,res){
       let filter = {};
       let options = {};
       songsRepository.getSongs(filter, options).then(songs=>{
           res.status(200);
           res.send({songs:songs});
       }).catch(error=>{
           res.status(500);
           res.json({error:"Se ha producido un error al recuperar las canciones."});
       })
    });

    app.get("/api/v1.0/songs/:id", function (req,res){
       try{
           let songId = new ObjectId(req.params.id);
           let filter = {_id:songId};
           let options = {};
           songsRepository.findSong(filter, options).then(song=>{
               if(song===null){
                   res.status(404);
                   res.json({error:"Id inválido o no existe"});
               }else{
                   res.status(200);
                   res.json({song:song});
               }
           }).catch(error=>{
               res.status(500);
               res.json({error:"Se ha producido un error al recuperar la canción."});
           })
       } catch (e) {
           res.status(500);
           res.json({error: "Se ha producido un error: "+e})
       }
    });

    app.delete("/api/v1.0/songs/:id", function (req,res){
       try{
           let user = req.session.user;
           let songId = new ObjectId(req.params.id);
           let filter = {_id:songId};

           songsRepository.findSong(filter, {}).then(song=>{
               if(song.author !== user){
                   res.status(409);
                   res.json({error:"No eres el dueño de la canción"});
               }else{
                   songsRepository.deleteSong(filter, {}).then(result=>{
                       if(result===null || result.deletedCount===0){
                           res.status(404);
                           res.json({error:"ID inválido o no existe, no se ha borrado el registro."});
                       }else{
                           res.status(200);
                           res.send(JSON.stringify(result));
                       }
                   }).catch(error=>{
                       res.status(500);
                       res.json({error:"Se ha producido un error al eliminar la canción"});
                   });
               }
           }).catch(error=>{
               res.status(500);
               res.json({error:"Se ha producido un error al eliminar la canción"});
           });

       } catch (e){
           res.status(500);
           res.json({error:"Se ha producido un error, revise que el Id sea válido"});
       }
    });

    app.post("/api/v1.0/songs", function (req,res){
        try{
            let song = {
                title:req.body.title,
                kind:req.body.kind,
                price:req.body.price,
                author:req.session.user
            }

            let errorMsg = [];

            //validar aquí
            if(song.title==="" || song.kind==="" || song.price===""){
                //res.status(409);
                //res.json({error:"Ningún campo puede quedar vacío"});
                errorMsg.push("Ningún campo puede quedar vacío");
            }if(song.title.length < 5 || song.title.length > 10 ){
                //res.status(409);
                //res.json({error: "El título de la canción debe estar entre 5 y 10 caracteres"});
                errorMsg.push("El título de la canción debe estar entre 5 y 10 caracteres");
            }if(parseFloat(song.price) < 0){
                //res.status(409);
                //res.json({error: "El precio debe ser positivo"})
                errorMsg.push("El precio debe ser positivo");

            }

            if(errorMsg.length !== 0){
                res.status(409);
                res.json({error:"Hay errores",
                    errors: errorMsg});
            }
            else{


                songsRepository.insertSong(song, function (songId){
                    if(songId===null){
                        res.status(409);
                        res.json({error:"No se ha podido crear la canción. El recurso ya existe"});
                    }else{
                        res.status(200);
                        res.json({
                            message:"Canción añadida correctamente",
                            _id:songId
                        });
                    }
                });
            }

        }catch (e) {
            res.status(500);
            res.json({json:"Se ha producido un error al intentar crear la canción: "+e});
        }
    });

    app.put("/api/v1.0/songs/:id", function (req, res){
        try{
            let user = req.session.user;
            let songId = new ObjectId(req.params.id);
            let filter = {_id:songId};
            let errorMsg = [];
            //No crea doc si la id no existe
            const options = {upsert:false};
            let song = {
                author: req.session.user
            };

            if(typeof req.body.title !== "undefined" && req.body.title !==null){
                song.title = req.body.title;
            }
            if(typeof req.body.kind !== "undefined" && req.body.kind !==null){
                song.kind = req.body.kind;
            }
            if(typeof req.body.price !== "undefined" && req.body.price !==null){
                song.price = req.body.price;
            }

            if(song.title==="" || song.kind==="" || song.price===""){
                //res.status(409);
                //res.json({error:"Ningún campo puede quedar vacío"});
                errorMsg.push("Ningún campo puede quedar vacío");
            }if(song.title.length < 5 || song.title.length > 10 ){
                //res.status(409);
                //res.json({error: "El título de la canción debe estar entre 5 y 10 caracteres"});
                errorMsg.push("El título de la canción debe estar entre 5 y 10 caracteres");
            }if(parseFloat(song.price) < 0){
                //res.status(409);
                //res.json({error: "El precio debe ser positivo"})
                errorMsg.push("El precio debe ser positivo");

            }

            if(errorMsg.length !== 0){
                res.status(409);
                res.json({error:"Hay errores",
                    errors: errorMsg});
            }
            else {


                songsRepository.findSong(filter, {}).then(song=> {
                    if (song.author !== user) {
                        res.status(409);
                        res.json({error: "No eres el dueño de la canción"});
                    } else {
                        console.log(song);
                        songsRepository.updateSong(song, filter, options).then(result => {
                            if (result === null) {
                                res.status(404);
                                res.json({error: "ID inválido, no existe, no se ha actualizado la canción"});
                            } else if (result.modifiedCount === 0) {
                                res.status(409);
                                res.json({error: "No se ha modificado ninguna canción"});
                            } else {
                                res.status(200);
                                res.json({
                                    message: "Canción modificada correctamente",
                                    result: result
                                });
                            }
                        }).catch(error => {
                            res.status(500);
                            res.json({error: "Se ha producido un error al modificar la canción"});
                        });
                    }
                }).catch(error => {
                    res.status(500);
                    res.json({error: "Se ha producido un error al modificar la canción"});
                });
            }
        }catch (e) {
            res.status(500);
            res.json({error:"Se ha producido un error al intentar modificar la canción: "+e});
        }
    });

    app.post("/api/v1.0/users/login", function (req,res){
        try{
            let securePassword = app.get("crypto").createHmac("sha256", app.get("clave"))
                .update(req.body.password).digest("hex");
            let filter = {
                email: req.body.email,
                password: securePassword
            };
            let options = {};
            usersRepository.findUser(filter, options).then(user=>{
                if(user==null){
                    res.status(401);
                    res.json({
                        message:"usuario no autorizado",
                        authenticated:false
                    });
                }else{
                    let token = app.get("jwt").sign(
                        {user: user.email, time:Date.now()/1000},
                        "secreto"
                    );

                    req.session.user = user.email;

                    res.status(200);
                    res.json({
                        message:"usuario autorizado",
                        authenticated:true,
                        token:token
                    });
                }
            }).catch(error=>{
                res.status(401);
                res.json({
                    message:"Se ha producido un error al verificar credenciales",
                    authenticated:false
                });
            })
        }catch (e){
            res.status(500);
            res.json({
                message: "Se ha producido un error al verificar credenciales",
                authenticated: false
            });
        }
    });
}