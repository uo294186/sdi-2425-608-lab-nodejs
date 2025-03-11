module.exports=function (app){
    app.get("/authors/add", function(req,res){

        let rols = [{
            "value" : "cantante",
            "name": "Cantante"
        },{
            "value" : "trompetista",
            "name": "Trompetista"
        },{
            "value" : "violinista",
            "name": "Violinista"
        },{
            "value" : "saxofonista",
            "name": "Saxofonista"
        },{
            "value" : "pianista",
            "name": "Pianista"
        }];

        let response = {
            rols : rols
        }

        res.render("authors/add.twig", response);
    });

    app.post("/authors/add", function(req,res){

        let response = "";
        if(req.body.name != null && typeof (req.body.name)!="undefined" && !(req.body.name === "")){
            response+= "Nombre: "+req.body.name+"<br>";
        }else{
            response += "Nombre del autor no definido"+"<br>";
        }

        if(req.body.group != null && typeof (req.body.group)!="undefined" && !(req.body.group === "")){
            response+= "Grupo: "+req.body.group+"<br>";
        }else{
            response += "Grupo del autor no definido"+"<br>";
        }

        if(req.body.rol != null && typeof (req.body.rol)!="undefined"){
            response+= "Rol: "+req.body.rol+"<br>";
        }else{
            response += "Rol del autor no definido"+"<br>";
        }

        res.send(response);
    });


    app.get("/authors/", function (req,res){

        let authors =[{
            "name":"Paco",
            "group":"Nirvana",
            "rol":"cantante"
        },{
            "name":"Antonio",
            "group":"ACDC",
            "rol":"saxofonista"
        },{
            "name":"Eustaquio",
            "group":"Ejemplo",
            "rol":"violinista"
        }];

        let response = {
            authors : authors
        }


        res.render("authors/authors.twig",response);

    });

    app.get("/authors/filter/:rol", function (req,res){

        let authors =[{
            "name":"Paco",
            "group":"Nirvana",
            "rol":"cantante"
        },{
            "name":"Antonio",
            "group":"ACDC",
            "rol":"saxofonista"
        },{
            "name":"Eustaquio",
            "group":"Ejemplo",
            "rol":"violinista"
        }];

        let rol = req.params.rol;


        let response = {
            authors : authors.filter(author=>author.rol.toLowerCase() === rol.toLowerCase())
        }

        res.render("authors/authors.twig",response);

    });

    app.get("/author*/", function (req,res){
        res.redirect("/authors/");
    });

};

