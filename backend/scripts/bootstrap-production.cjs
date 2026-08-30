const { Client } = require("pg");
const bcrypt = require("bcrypt");

const CONFIRMATION_PHRASE =
  "CREATE_REFLEX_PRODUCTION_ACCOUNTS";

const allowedBusinessTypes = new Set([
  "electronics",
  "pharmacy",
  "hardware",
  "other",
]);

function required(name) {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} environment variable is required`
    );
  }

  return value;
}

function validatePassword(
  name,
  password
) {
  if (password.length < 12) {
    throw new Error(
      `${name} must contain at least 12 characters`
    );
  }
}

async function main() {
  const databaseUrl =
    required("DATABASE_URL");

  const confirmation =
    required("BOOTSTRAP_CONFIRM");

  if (
    confirmation !==
    CONFIRMATION_PHRASE
  ) {
    throw new Error(
      "Production bootstrap confirmation phrase is incorrect"
    );
  }

  const businessName =
    required("BUSINESS_NAME");

  const businessType =
    required("BUSINESS_TYPE");

  const businessAddress =
    required("BUSINESS_ADDRESS");

  const businessPhone =
    required("BUSINESS_PHONE");

  if (
    !allowedBusinessTypes.has(
      businessType
    )
  ) {
    throw new Error(
      "BUSINESS_TYPE must be electronics, pharmacy, hardware, or other"
    );
  }

  const retailer = {
    name:
      required("RETAILER_NAME"),

    phone:
      required("RETAILER_PHONE"),

    password:
      required(
        "RETAILER_PASSWORD"
      ),

    role:
      "retailer",
  };

  const dispatcher = {
    name:
      required(
        "DISPATCHER_NAME"
      ),

    phone:
      required(
        "DISPATCHER_PHONE"
      ),

    password:
      required(
        "DISPATCHER_PASSWORD"
      ),

    role:
      "dispatcher",
  };

  const rider = {
    name:
      required("RIDER_NAME"),

    phone:
      required("RIDER_PHONE"),

    password:
      required(
        "RIDER_PASSWORD"
      ),

    role:
      "rider",
  };

  validatePassword(
    "RETAILER_PASSWORD",
    retailer.password
  );

  validatePassword(
    "DISPATCHER_PASSWORD",
    dispatcher.password
  );

  validatePassword(
    "RIDER_PASSWORD",
    rider.password
  );

  const phones = [
    retailer.phone,
    dispatcher.phone,
    rider.phone,
  ];

  if (
    new Set(phones).size !==
    phones.length
  ) {
    throw new Error(
      "Retailer, dispatcher, and rider phone numbers must be different"
    );
  }

  const client =
    new Client({
      connectionString:
        databaseUrl,
    });

  await client.connect();

  try {
    await client.query(
      "BEGIN"
    );

    /*
     * Prevent two bootstrap processes
     * from running concurrently.
     */
    await client.query(
      "LOCK TABLE businesses IN EXCLUSIVE MODE"
    );

    await client.query(
      "LOCK TABLE users IN EXCLUSIVE MODE"
    );

    /*
     * This bootstrap is intentionally
     * one-time only.
     */
    const existingBusinesses =
      await client.query(`
        SELECT COUNT(*)::int AS count
        FROM businesses
      `);

    const existingUsers =
      await client.query(`
        SELECT COUNT(*)::int AS count
        FROM users
      `);

    if (
      existingBusinesses.rows[0]
        .count !== 0 ||
      existingUsers.rows[0]
        .count !== 0
    ) {
      throw new Error(
        "Bootstrap refused: production already contains a business or user"
      );
    }

    const businessResult =
      await client.query(
        `
          INSERT INTO businesses (
            name,
            type,
            address,
            phone
          )
          VALUES (
            $1,
            $2,
            $3,
            $4
          )
          RETURNING
            id,
            name,
            type,
            phone
        `,
        [
          businessName,
          businessType,
          businessAddress,
          businessPhone,
        ]
      );

    const business =
      businessResult.rows[0];

    /*
     * Hash passwords before inserting
     * them into PostgreSQL.
     */
    const [
      retailerHash,
      dispatcherHash,
      riderHash,
    ] =
      await Promise.all([
        bcrypt.hash(
          retailer.password,
          12
        ),

        bcrypt.hash(
          dispatcher.password,
          12
        ),

        bcrypt.hash(
          rider.password,
          12
        ),
      ]);

    const users = [
      {
        ...retailer,
        passwordHash:
          retailerHash,
      },

      {
        ...dispatcher,
        passwordHash:
          dispatcherHash,
      },

      {
        ...rider,
        passwordHash:
          riderHash,
      },
    ];

    const createdUsers = [];

    for (
      const user of users
    ) {
      const result =
        await client.query(
          `
            INSERT INTO users (
              business_id,
              name,
              phone,
              password_hash,
              role,
              is_active
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              TRUE
            )
            RETURNING
              id,
              name,
              phone,
              role
          `,
          [
            business.id,
            user.name,
            user.phone,
            user.passwordHash,
            user.role,
          ]
        );

      createdUsers.push(
        result.rows[0]
      );
    }

    await client.query(
      "COMMIT"
    );

    console.log("");
    console.log(
      "Reflex production bootstrap completed successfully."
    );

    console.log("");
    console.log(
      "Business:"
    );

    console.log({
      id:
        business.id,

      name:
        business.name,

      type:
        business.type,

      phone:
        business.phone,
    });

    console.log("");
    console.log(
      "Users:"
    );

    for (
      const user of createdUsers
    ) {
      console.log({
        id:
          user.id,

        name:
          user.name,

        phone:
          user.phone,

        role:
          user.role,
      });
    }

    console.log("");
    console.log(
      "Passwords were not printed."
    );
  } catch (error) {
    try {
      await client.query(
        "ROLLBACK"
      );
    } catch {
      // Ignore rollback failure.
    }

    throw error;
  } finally {
    await client.end();
  }
}

main().catch(
  (error) => {
    console.error("");
    console.error(
      "Bootstrap failed:"
    );

    console.error(
      error instanceof Error
        ? error.message
        : error
    );

    process.exit(1);
  }
);