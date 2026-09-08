import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";

import { db } from "../config/db";


async function findBusinessByCode(
  code: string
) {

  const result =
    await db.query(
      `
      SELECT
        id,
        name,
        business_code
      FROM businesses
      WHERE business_code = $1
      LIMIT 1
      `,
      [
        code.toUpperCase()
      ]
    );


  return result.rows[0] ?? null;

}



function generateBusinessCode(
  name:string
){

  const prefix =
    name
      .replace(
        /[^a-zA-Z]/g,
        ""
      )
      .substring(0,4)
      .toUpperCase();


  const number =
    Math.floor(
      10000 +
      Math.random() * 90000
    );


  return `${prefix}-${number}`;

}



const loginSchema =
  z.object({

    phone:
      z.string()
      .trim()
      .min(7),


    password:
      z.string()
      .min(1),

  });



const registerSchema =
  z.object({

    role:
      z.enum([
        "retailer",
        "dispatcher",
        "rider",
      ]),


    business_code:
      z.string()
      .trim()
      .min(3)
      .optional(),



    business:
      z.object({

        name:
          z.string()
          .trim()
          .min(2),


        type:
          z.enum([
            "electronics",
            "pharmacy",
            "hardware",
            "other",
          ]),


        address:
          z.string()
          .trim()
          .min(2),


        phone:
          z.string()
          .trim()
          .min(7),

      })
      .optional(),



    name:
      z.string()
      .trim()
      .min(2),



    phone:
      z.string()
      .trim()
      .min(7),



    password:
      z.string()
      .min(8),

  });




export default async function authRoutes(
  app: FastifyInstance
){




/*
==========================================================
LOGIN
==========================================================
*/


app.post(
"/auth/login",

async(
request,
reply
)=>{


const parsed =
loginSchema.safeParse(
request.body
);



if(!parsed.success){

return reply
.status(422)
.send({

success:false,

error:{
code:
"VALIDATION_ERROR",

message:
"Phone and password are required"

}

});

}



const {
phone,
password
} =
parsed.data;



const result =
await db.query(

`
SELECT
users.id,
users.business_id,
users.name,
users.phone,
users.password_hash,
users.role,
users.is_active,

businesses.name AS business_name,
businesses.business_code

FROM users

JOIN businesses
ON businesses.id = users.business_id

WHERE users.phone=$1

LIMIT 1
`,

[
phone
]

);



if(!result.rows.length){

return reply
.status(401)
.send({

success:false,

error:{
code:
"INVALID_CREDENTIALS",

message:
"Invalid phone or password"

}

});

}



const user =
result.rows[0];



if(!user.is_active){

return reply
.status(403)
.send({

success:false,

error:{
code:
"ACCOUNT_DISABLED",

message:
"Account disabled"

}

});

}



const passwordMatches =
await bcrypt.compare(
password,
user.password_hash
);



if(!passwordMatches){

return reply
.status(401)
.send({

success:false,

error:{
code:
"INVALID_CREDENTIALS",

message:
"Invalid phone or password"

}

});

}




const token =
app.jwt.sign(

{

sub:
user.id,

business_id:
user.business_id,

role:
user.role,

name:
user.name,

},

{
expiresIn:"15m"
}

);



return reply.send({

success:true,

access_token:
token,

token_type:
"Bearer",

expires_in:
900,


user:{
  id:
    user.id,

  business_id:
    user.business_id,

  name:
    user.name,

  phone:
    user.phone,

  role:
    user.role,

  business_name:
    user.business_name,

  business_code:
    user.business_code,
}

});


}

);






/*
==========================================================
REGISTER
==========================================================
*/


app.post(
"/auth/register",

async(
request,
reply
)=>{


const parsed =
registerSchema.safeParse(
request.body
);



if(!parsed.success){

return reply
.status(422)
.send({

success:false,

error:{
code:
"VALIDATION_ERROR",

message:
"Invalid registration details"

}

});

}



const data =
parsed.data;



const client =
await db.connect();



try{


await client.query(
"BEGIN"
);



let businessId:string;



let business:
{
name:string;
business_code:string;
}
| null = null;




/*
==========================================================
RETAILER CREATES BUSINESS
==========================================================
*/


if(data.role==="retailer"){



if(!data.business){

return reply
.status(400)
.send({

success:false,

error:{
code:
"BUSINESS_REQUIRED",

message:
"Business details required"

}

});

}



const businessCode =
generateBusinessCode(
data.business.name
);



const result =
await client.query(

`
INSERT INTO businesses
(
business_code,
name,
type,
address,
phone
)

VALUES
($1,$2,$3,$4,$5)

RETURNING
id,
name,
business_code
`,

[

businessCode,

data.business.name,

data.business.type,

data.business.address,

data.business.phone

]

);



businessId =
result.rows[0].id;

business =
result.rows[0];


}





/*
==========================================================
DISPATCHER / RIDER JOIN BUSINESS
==========================================================
*/


else{


if(!data.business_code){

return reply
.status(400)
.send({

success:false,

error:{
code:
"BUSINESS_CODE_REQUIRED",

message:
"Business code is required"

}

});

}



const foundBusiness =
await findBusinessByCode(
data.business_code
);



if(!foundBusiness){

return reply
.status(404)
.send({

success:false,

error:{
code:
"BUSINESS_NOT_FOUND",

message:
"Invalid business code"

}

});

}



businessId =
foundBusiness.id;

business =
foundBusiness;


}




const existing =
await client.query(

`
SELECT id
FROM users
WHERE phone=$1
`,

[
data.phone
]

);



if(existing.rows.length){

return reply
.status(409)
.send({

success:false,

error:{
code:
"PHONE_EXISTS",

message:
"Phone already registered"

}

});

}




const passwordHash =
await bcrypt.hash(
data.password,
12
);



const userResult =
await client.query(

`
INSERT INTO users
(
business_id,
name,
phone,
password_hash,
role
)

VALUES
($1,$2,$3,$4,$5::user_role)

RETURNING
id,
business_id,
name,
phone,
role
`,

[

businessId,

data.name,

data.phone,

passwordHash,

data.role

]

);



await client.query(
"COMMIT"
);



const user =
userResult.rows[0];



const token =
app.jwt.sign(

{

sub:
user.id,

business_id:
user.business_id,

role:
user.role,

name:
user.name,

business_name:
business?.name,

business_code:
business?.business_code,

},
{
expiresIn:"15m"
}

);



return reply.send({

success:true,

access_token:
token,

token_type:
"Bearer",

expires_in:
900,


user,

business

});



}
catch(error){


await client.query(
"ROLLBACK"
);


request.log.error(
error
);



return reply
.status(500)
.send({

success:false,

error:{
code:
"REGISTRATION_FAILED",

message:
"Unable to create account"

}

});


}
finally{


client.release();


}


}

);


}