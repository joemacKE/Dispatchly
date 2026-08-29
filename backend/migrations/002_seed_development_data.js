exports.up = async (pgm) => {
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

  await pgm.db.query(
    `
      INSERT INTO users (
        business_id,
        name,
        phone,
        password_hash,
        role
      )
      VALUES
      ($1, 'Demo Retailer', '+254700000002', 'DEMO_PASSWORD_HASH', 'retailer'),
      ($1, 'Demo Dispatcher', '+254700000003', 'DEMO_PASSWORD_HASH', 'dispatcher'),
      ($1, 'Demo Rider', '+254700000004', 'DEMO_PASSWORD_HASH', 'rider')
    `,
    [businessId]
  );
};

exports.down = async (pgm) => {
  await pgm.db.query(`
    DELETE FROM businesses
    WHERE phone = '+254700000001'
  `);
};
