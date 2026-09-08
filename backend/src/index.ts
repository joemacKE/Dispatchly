import Fastify from "fastify";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

import { db } from "./config/db";

import {
  connectRedis,
  disconnectRedis,
  redis,
} from "./config/redis";

import { env } from "./config/env";


import authRoutes from "./routes/auth";
import dashboardRoutes from "./routes/dashboard";
import deliveryRequestsRoutes from "./routes/deliveryRequests";
import ridersRoutes from "./routes/riders";
import dispatchRoutes from "./routes/dispatch";

import riderWorkflowRoutes from "./routes/riderWorkflow";
import proofOfDeliveryRoutes from "./routes/proofOfDelivery";
import syncRoutes from "./routes/sync";
import pickupVerificationRoutes from "./routes/pickupVerification";
import deliveryVerificationRoutes from "./routes/deliveryVerification";

import websocketRoutes from "./realtime/websocket";



const app = Fastify({

  logger:{
    level:
      env.IS_PRODUCTION
        ? "info"
        : "debug",
  },


  bodyLimit:
    1_048_576,


  trustProxy:
    env.TRUST_PROXY,

});





async function bootstrap(){

try{


/*
==========================================================
INFRASTRUCTURE
==========================================================
*/


await connectRedis();





/*
==========================================================
JWT
==========================================================
*/


await app.register(jwt,{
  secret:
    env.JWT_SECRET,
});





/*
==========================================================
WEBSOCKET SUPPORT
==========================================================
*/


await app.register(websocket);





/*
==========================================================
SWAGGER
==========================================================
*/


await app.register(swagger,{

  openapi:{

    info:{

      title:
        "Dispatchly Delivery Coordination API",

      description:
        "API for retailer, dispatcher and rider delivery coordination.",

      version:
        "0.1.0",

    },


    servers:[

      {

        url:
          env.API_PUBLIC_URL,

        description:
          env.IS_PRODUCTION
          ? "Production"
          : "Local development",

      },

    ],


    components:{

      securitySchemes:{

        bearerAuth:{

          type:"http",

          scheme:"bearer",

          bearerFormat:"JWT",

        },

      },

    },

  },

});





await app.register(swaggerUi,{

routePrefix:"/docs",

uiConfig:{

docExpansion:"list",

deepLinking:false,

},

});






/*
==========================================================
CORS
==========================================================
*/


await app.register(cors,{

origin:
  env.CORS_ORIGINS,


methods:[

"GET",

"POST",

"PATCH",

"DELETE",

"OPTIONS",

],


allowedHeaders:[

"Content-Type",

"Authorization",

],

});






/*
==========================================================
SECURITY HEADERS
==========================================================
*/


await app.register(helmet,{

contentSecurityPolicy:false,

});






/*
==========================================================
RATE LIMIT
==========================================================
*/


await app.register(rateLimit,{

max:120,

timeWindow:"1 minute",

});






/*
==========================================================
ERROR HANDLER
==========================================================
*/


app.setErrorHandler(

async(

error,

request,

reply

)=>{


const apiError =
error as {

statusCode?:number;

code?:string;

message?:string;

};



const statusCode =
typeof apiError.statusCode==="number"

? apiError.statusCode

:500;




request.log.error(

{

err:error,

request_id:
request.id,

},

"Request failed"

);





if(apiError.code==="FST_ERR_CTP_BODY_TOO_LARGE"){

return reply
.status(413)
.send({

success:false,

error:{

code:"PAYLOAD_TOO_LARGE",

message:"Request payload is too large",

},

request_id:
request.id,

});

}





if(statusCode>=400 && statusCode<500){

return reply
.status(statusCode)
.send({

success:false,

error:{

code:"REQUEST_ERROR",

message:
apiError.message ??
"Request could not be processed",

},

request_id:
request.id,

});

}





return reply
.status(500)
.send({

success:false,

error:{

code:"INTERNAL_SERVER_ERROR",

message:
"An unexpected server error occurred",

},

request_id:
request.id,

});


}

);






/*
==========================================================
404 HANDLER
==========================================================
*/


app.setNotFoundHandler(

async(

request,

reply

)=>{


return reply
.status(404)
.send({

success:false,

error:{

code:"NOT_FOUND",

message:"Route not found",

},

request_id:
request.id,

});


}

);








/*
==========================================================
APPLICATION ROUTES
==========================================================
*/


await app.register(
  authRoutes
);


await app.register(
  deliveryRequestsRoutes
);


await app.register(
  dashboardRoutes
);


await app.register(
  ridersRoutes
);


await app.register(
  dispatchRoutes
);


await app.register(
  riderWorkflowRoutes
);


await app.register(
  proofOfDeliveryRoutes
);


await app.register(
  pickupVerificationRoutes
);


await app.register(
  deliveryVerificationRoutes
);


await app.register(
  syncRoutes
);






/*
==========================================================
WEBSOCKET ROUTES
==========================================================
*/


await app.register(
  websocketRoutes
);






/*
==========================================================
HEALTH CHECK
==========================================================
*/


app.get(

"/health",

{

config:{

rateLimit:false,

},

},

async(

_request,

reply

)=>{


try{


const [

databaseResult,

redisResult,

]=await Promise.all([


db.query(
"SELECT NOW()"
),


redis.ping(),


]);



return {


status:"ok",


database:
"connected",


redis:
redisResult==="PONG"
?"connected"
:"unknown",


time:
databaseResult.rows[0].now,


};



}catch(error){


app.log.error(

{

err:error,

},

"Health check failed"

);



return reply
.status(503)
.send({

status:"unhealthy",

});

}


}

);








/*
==========================================================
START SERVER
==========================================================
*/


await app.listen({

port:
env.PORT,


host:"0.0.0.0",

});



app.log.info(

{

port:
env.PORT,

},

"Dispatchly API started successfully"

);




}catch(error){


app.log.error(

{

err:error,

},

"Failed to start Dispatchly API"

);


process.exit(1);


}


}






async function shutdown(
signal:string
){


try{


app.log.info(

{

signal,

},

"Shutting down API"

);



await app.close();


await disconnectRedis();


await db.end();



process.exit(0);



}catch(error){


app.log.error(

{

err:error,

},

"Shutdown failed"

);



process.exit(1);


}


}





process.on(

"SIGTERM",

()=>{

void shutdown(
"SIGTERM"
);

}

);



process.on(

"SIGINT",

()=>{

void shutdown(
"SIGINT"
);

}

);





void bootstrap();