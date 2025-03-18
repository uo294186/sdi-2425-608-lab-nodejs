const {data} = require("express-session/session/cookie");
module.exports = {
    mongoClient: null,
    app: null,
    database: "musicStore",
    collectionName: "comments",
    init: function (app, dbClient) {
        this.dbClient = dbClient;
        this.app = app;
    },
    getComments:async function(filter, options){
        try{
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const songsCollection = database.collection(this.collectionName);
            const comments = await songsCollection.find(filter, options).toArray();
            return comments;
        }catch (error){
            throw (error);
        }
    },
    insertComment: function (comment, callbackFunction) {
        this.dbClient.connect()
            .then(() => {
                const database = this.dbClient.db(this.database);
                const songsCollection = database.collection(this.collectionName);
                songsCollection.insertOne(comment)
                    .then(result => callbackFunction({commentId: result.insertedId}))
                    .then(() => this.dbClient.close())
                    .catch(err => callbackFunction({error: err.message}));
            })
            .catch(err => callbackFunction({error: err.message}))
    }
}