import type {
  FastifyInstance,
} from "fastify";

import {
  db,
} from "../config/db";


type AuthUser = {
  sub:string;
  business_id:string;
  role:string;
};


export default async function dashboardRoutes(
  app:FastifyInstance
){


app.get(
"/dashboard/stats",
async(request,reply)=>{


await request.jwtVerify();


const user =
request.user as AuthUser;


const result =
await db.query(
`
SELECT

COUNT(*)::int AS total,

COUNT(*) FILTER(
WHERE status='pending'
)::int AS pending,


COUNT(*) FILTER(
WHERE status IN(
'assigned',
'picked_up',
'in_transit'
)
)::int AS active,


COUNT(*) FILTER(
WHERE status='delivered'
)::int AS delivered


FROM delivery_requests

WHERE business_id=$1

`,
[
user.business_id
]
);


return reply.send({

success:true,

stats:result.rows[0]

});


}
);




app.get(
"/dashboard/orders",
async(request,reply)=>{


await request.jwtVerify();


const user =
request.user as AuthUser;


const {
status
}=request.query as {
status?:string;
};



let queryStatus:any = null;



if(status==="active"){

queryStatus=[
"assigned",
"picked_up",
"in_transit"
];

}

else if(status){

queryStatus=[
status
];

}




const result =
await db.query(
`

SELECT

id,

customer_name,

customer_phone,

customer_address,

item_description,

status,

payment_method,

payment_status,

payment_amount,

created_at


FROM delivery_requests


WHERE business_id=$1


AND
(
$2::text IS NULL

OR

status::text = ANY($2::text[])

)


ORDER BY created_at DESC


`,
[
user.business_id,
queryStatus
]
);



return reply.send({

success:true,

orders:result.rows

});


}

);


}