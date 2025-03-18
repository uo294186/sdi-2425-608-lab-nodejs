const {data} = require("express-session/session/cookie");
module.exports = {
    mongoClient: null,
    app: null,
    database: "musicStore",
    collectionName: "favorite_songs",
    init: function (app, dbClient) {
        this.dbClient = dbClient;
        this.app = app;
    },
    deleteFavorite:async function(filter, options){
        try{
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const songsCollection = database.collection(this.collectionName);
            const res = await songsCollection.deleteOne(filter, options);
        }  catch (error){
            throw (error)
        }
    },
    getFavorites:async function(filter, options){
        try{
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const songsCollection = database.collection(this.collectionName);
            const favorites = await songsCollection.find(filter, options).toArray();
            return favorites;
        }catch (error){
            throw (error);
        }
    },
    insertFavorite: function (favorite, callbackFunction) {
        this.dbClient.connect()
            .then(() => {
                const database = this.dbClient.db(this.database);
                const songsCollection = database.collection(this.collectionName);
                songsCollection.insertOne(favorite)
                    .then(result => callbackFunction({favoriteId: result.insertedId}))
                    .then(() => this.dbClient.close())
                    .catch(err => callbackFunction({error: err.message}));
            })
            .catch(err => callbackFunction({error: err.message}))
    }
}