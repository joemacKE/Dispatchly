exports.up = async (pgm) => {
  // Create one development business
  const businessResult = await pgm.db.query(`
    INSERT INTO businesses (
      name,
      type,
      address,
      phone
    )
    VALUES (
      'Dispatchly Electronics',
      'electronics',
      'Nairobi CBD',
      '+254700000001'
    )
    RETURNING id
  `);

  const businessId = businessResult.rows[0].id;

  // Create development users
  await pgm.db.query(
    `
      INSERT INTO users (
        business_id,
        name,
        phone,
        password_hash,
        role,
        is_active
      )
      VALUES
        (
          $1,
          'Demo Retailer',
          '+254700000002',
          'DEMO_PASSWORD_HASH',
          'retailer',
          true
        ),
        (
          $1,
          'Demo Dispatcher',
          '+254700000003',
          'DEMO_PASSWORD_HASH',
          'dispatcher',
          true
        ),
        (
          $1,
          'Demo Rider',
          '+254700000004',
          'DEMO_PASSWORD_HASH',
          'rider',
          true
        )
    `,
    [businessId]
  );
};

exports.down = async (pgm) => {
  // Delete seed users first because they reference the business
  await pgm.db.query(`
    DELETE FROM users
    WHERE phone IN (
      '+254700000002',
      '+254700000003',
      '+254700000004'
    )
  `);

  await pgm.db.query(`
    DELETE FROM businesses
    WHERE phone = '+254700000001'
  `);
};
