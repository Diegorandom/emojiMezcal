var express = require('express');
var app = express();
var neo4j = require('neo4j-driver').v1;
var bodyParser = require('body-parser');
var geoip = require('geoip-lite');
var csv = require("fast-csv");
var fs = require('fs');
var http = require('http');

var imagen = 'img/emojimezcal.gif', color = 'none', ip = null, lang = null, geo, country = null, metro = null, zip = null, ll = null, region = null, city = null;

//CONFIGURACIÓN DE MÓDULOS INTERNOS DE EXPRESS
app.use(bodyParser.json()); //DECLARACION DE PROTOCOLO DE LECTURA DE LAS VARIABLES INTERNAS "BODY" DE LAS FUNCIONES 
app.use(bodyParser.urlencoded({ extended:true})); //DECLARACIÓN DE ENCODER DE URL

// Conexión con base de datos remota
var graphenedbURL = process.env.GRAPHENEDB_BOLT_URL;
var graphenedbUser = process.env.GRAPHENEDB_BOLT_USER;
var graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD;

if(graphenedbURL == undefined){
	var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', 'mdl'));
	var session = driver.session();
}else{
	var driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));
	var session = driver.session();
};

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var csvStream = csv.createWriteStream({headers: true}),
    writableStream = fs.createWriteStream("public/emojivoters.csv");
 
writableStream.on("finish", function(){
  console.log("DONE!");
});
 
var bd = new Array();

session
    .run('MATCH (u:EmojiVoter) RETURN u.email, u.ip, u.country, u.ciudad, u.metrocode, u.region, u.zip')
    .then(function(resultado){
        csvStream.pipe(writableStream);
        console.log("starting the writing");
        resultado.records.forEach(function(record, item){
              var nodo = new Array();
              for(var i = 0; i < 6;i++){
                nodo[i] = record._fields[i]
              }
            // console.log('escribiendo un nodo')
            // console.log(nodo)
            bd.push(nodo);
            csvStream.write(nodo);
            //console.log('nodes: ' + item)
        })
        console.log('end of writing')
        csvStream.end();
    })
    .catch(function(error){
        console.log(error);
    })


app.get('/', function(request, response) {

console.log('Ip:');
ip = request.headers['x-forwarded-for'];

console.log(ip); 
    
geo = geoip.lookup(ip);   
    
if(geo != undefined){
    country = geo.country;
    region = geo.region;
    city = geo.city;
    ll = geo.ll;
    metro = geo.metro;
    zip = geo.zip;
}else{
    country = null;
    region = null;
    city = null;
    metro = null;
    ll = null;
    zip = null;
};
  /*
var azar = Math.random();

    console.log("azar");
    console.log(azar);
    
if(azar > 0.5){
    console.log("voto con correo");
}else{
    console.log("voto con correo");
} */
    
console.log(geo);    
    
imagen = 'img/emoji_veladora.gif'; 
color = 'none';

    if(geo != undefined){
        if(geo.country ==  'MX' || geo.country ==  'AR' || geo.country ==  'BO' || geo.country ==  'BR' || geo.country ==  'CL' || geo.country ==  'CO' || geo.country ==  'EC' || geo.country ==  'FK' || geo.country ==  'GF' || geo.country ==  'GY' || geo.country ==  'PY' || geo.country ==  'PE' || geo.country ==  'SR' || geo.country ==  'UY' || geo.country ==  'VE' || geo.country == 'BZ' || geo.country == 'CR' || geo.country == 'CU' || geo.country == 'DO' || geo.country == 'SV' || geo.country == 'GT' || geo.country == 'HT' || geo.country == 'HN' || geo.country == 'PA' || geo.country == 'PR' || geo.country == 'ES' ){

             response.render('pages/es/index', {
                imagen: imagen,
                color: color,
                mensaje: ""
            });

            lang = "es";

        }else{

           response.render('pages/en/index', {
                imagen: imagen,
                color: color,
                mensaje: ""
          }); 

            lang = "en";

        }    
    }else{
        response.render('pages/es/index', {
                imagen: imagen,
                color: color,
                mensaje: ""
            });
    };
        
    
});

app.get('/votacion', function(req,res,error){
    imagen = 'img/emoji_veladora.gif'; 
    color = 'none';
    if(error == true){
       if(lang == "es" || lang == null){
            res.render('pages/es/index', {
                imagen: imagen,
                color: color,
                mensaje: ""
            });
        }else{
            res.render('pages/en/index', {
                imagen: imagen,
                color: color,
                mensaje: ""
            });
        }
    }
    if(lang == "es" || lang == null){
            res.render('pages/es/index', {
                imagen: imagen,
                color: color,
                mensaje: ""
            });
        }else{
            res.render('pages/en/index', {
                imagen: imagen,
                color: color,
                mensaje: ""
            });
        }
});

app.post('/votacion', function(req, res, error){
    if(error == true){
        if(lang == "es" || lang == null){
            res.render('pages/es/index');
        }else{
            res.render('pages/en/index');
        }
    }
    
    console.log('Comenzando registro...');
    session
        .run('MATCH (n:EmojiVoter) WHERE n.ip = {ip} RETURN n', {ip:ip})
        .then(function(resultado) {
        
            
            
    if( resultado.records[0] != undefined){
        
        console.log('resultado: ');
            console.log(resultado.records[0]._fields[0].properties.ip);
        
          if( resultado.records[0]._fields[0].properties.ip == ip){
              if(lang == "es" || lang == null){
                  res.render('pages/es/index', {
                    imagen: imagen,
                    color: color,
                    mensaje: 'Ya has votado antes!'
                })
                
              }else{
                  res.render('pages/en/index', {
                    imagen: imagen,
                    color: color,
                    mensaje: 'Ya has votado antes!'
                })
                
              }
              
                console.log("Ya has votado antes!")
                
            }else{
            
            
            session
                .run('CREATE (n:EmojiVoter {ip: {ip}, country:{country}, region:{region}, ciudad:{city}, metrocode:{metro}, zip:{zip} }) RETURN n', {ip:ip, country:country, region:region, city:city, ll:ll, metro:metro, zip:zip})
                .then(function(resultado){
                    
                    color = '#ffcc16';
                    
                    if(lang == "es" || lang == null){
                        imagen = 'img/agradecimiento.gif';
                        res.render('pages/es/index', {
                            imagen: imagen,
                            color: color,
                            mensaje: ""
                        })
                    }else{
                        imagen = 'img/agradecimiento-en.gif';
                        res.render('pages/en/index', {
                            imagen: imagen,
                            color: color,
                            mensaje: ""
                        })
                    }
                    
                    console.log("Este correo ya ha sido registrado!")
                })
                .catch(function(error){
                    console.log(error);
                })
            
            }
            
    }else{
        
         console.log('resultado: ');
            console.log(resultado.records[0]);
        
        if(resultado.records[0] == ip ){
            
            if(lang == "es" || lang == null){
                res.render('pages/es/index', {
                    imagen: imagen,
                    color: color,
                    mensaje: 'Ya has votado con este correo!'
                })
            }else{
                res.render('pages/en/index', {
                    imagen: imagen,
                    color: color,
                    mensaje: 'You have already voted!'
                })
            }
            
            console.log("Este correo ya ha sido registrado!")
            
        }else{
            session
                 .run('CREATE (n:EmojiVoter {ip: {ip}, country:{country}, region:{region}, ciudad:{city}, metrocode:{metro}, zip:{zip} }) RETURN n', {ip:ip, country:country, region:region, city:city, ll:ll, metro:metro, zip:zip})
                 .then(function(resultado){
                    imagen = 'img/agradecimiento.gif';
                    color = '#ffcc16';
                
                    console.log('Este correo ha sido registrado exitosamente!');    
                
                    if(lang == "es" || lang == null){
                        res.render('pages/es/index', {
                            imagen: imagen,
                            color: color,
                            mensaje: "none"
                        })
                    }else{
                        res.render('pages/en/index', {
                            imagen: imagen,
                            color: color,
                            mensaje: "none"
                        })
                    } 
                
                })
                .catch(function(error){
                    console.log(error);
                })
        }
        
    }
        
        })
         .catch(function(error){
                console.log(error);
            }) 
    
    
     
});

app.get('/porque', function(req, res){
    
        console.log('Ip:');
        ip = req.headers['x-forwarded-for']
        console.log(ip); 

        geo = geoip.lookup(ip);
    
        if(geo != null){
            country = geo.country;  
        }else{
            country = null;
        
        }
        console.log(geo);
    
      if(geo != undefined){
        if(geo.country ==  'MX' || geo.country ==  'AR' || geo.country ==  'BO' || geo.country ==  'BR' || geo.country ==  'CL' || geo.country ==  'CO' || geo.country ==  'EC' || geo.country ==  'FK' || geo.country ==  'GF' || geo.country ==  'GY' || geo.country ==  'PY' || geo.country ==  'PE' || geo.country ==  'SR' || geo.country ==  'UY' || geo.country ==  'VE' || geo.country == 'BZ' || geo.country == 'CR' || geo.country == 'CU' || geo.country == 'DO' || geo.country == 'SV' || geo.country == 'GT' || geo.country == 'HT' || geo.country == 'HN' || geo.country == 'PA' || geo.country == 'PR' || geo.country == 'ES' || geo.country == undefined ){

             res.render('pages/es/porque');

            lang = "es";

        }else{

           res.render('pages/en/porque');

            lang = "en";

        }    
      }else{
          res.render('pages/es/porque');
      }
        
})

app.get('/proceso', function(req, res){
    
    console.log('Ip:');
    ip = req.headers['x-forwarded-for']
    console.log(ip); 

    geo = geoip.lookup(ip);
    
    if(geo != null){
        country = geo.country;  
    }else{
        country = null;
    };

    console.log(geo);
    
    if( geo != undefined){
         if(geo.country ==  'MX' || geo.country ==  'AR' || geo.country ==  'BO' || geo.country ==  'BR' || geo.country ==  'CL' || geo.country ==  'CO' || geo.country ==  'EC' || geo.country ==  'FK' || geo.country ==  'GF' || geo.country ==  'GY' || geo.country ==  'PY' || geo.country ==  'PE' || geo.country ==  'SR' || geo.country ==  'UY' || geo.country ==  'VE' || geo.country == 'BZ' || geo.country == 'CR' || geo.country == 'CU' || geo.country == 'DO' || geo.country == 'SV' || geo.country == 'GT' || geo.country == 'HT' || geo.country == 'HN' || geo.country == 'PA' || geo.country == 'PR' || geo.country == 'ES' || geo.country == undefined ){

            res.render('pages/es/proceso');

            lang = "es";

        }else{

          res.render('pages/en/proceso');

            lang = "en";

        }  
    }else{
         res.render('pages/es/proceso');
    }
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});