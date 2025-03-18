const {ObjectId} = require("mongodb");
module.exports=function (app, commentsRepository) {
    app.post("/comments/:song_id", function (req, res) {

        let comment = {
            song_id : new ObjectId(req.params.song_id),
            content : req.body.content,
            author : req.session.user
        }

        commentsRepository.insertComment(comment, function(result){
           if(result.commentId !== null && result.commentId!== undefined){
               res.send("Comentario añadido "+result.commentId);
           }else{
               res.send("Error al añadir "+result.error);
           }
        });

    });
}