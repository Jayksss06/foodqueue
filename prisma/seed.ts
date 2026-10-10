import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Memulai proses seeding data realistis FoodQueue...');

  // 1. Bersihkan data lama jika ada
  await prisma.review.deleteMany();
  await prisma.orderStatusLog.deleteMany();
  await prisma.paymentAttempt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.pickupSlot.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.tenantOperatingHour.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.category.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.orderCounter.deleteMany();

  // 2. Buat Venue Kampus
  const venue = await prisma.venue.create({
    data: {
      name: 'Kantin Pusat Kampus Merdeka',
      address: 'Gedung Student Center Lt. 1 & 2, Kampus Utama',
      timezone: 'Asia/Jakarta',
    },
  });

  // 3. Password hash
  const adminPass = await bcrypt.hash('Admin123!', 10);
  const tenantPass = await bcrypt.hash('Tenant123!', 10);
  const userPass = await bcrypt.hash('User123!', 10);

  // 4. Buat Akun Users
  // Admin
  const adminUser = await prisma.user.create({
    data: {
      name: 'Budi Santoso (Admin Kantin)',
      email: 'admin@foodqueue.id',
      passwordHash: adminPass,
      role: 'ADMIN',
      phone: '081299990001',
      status: 'ACTIVE',
    },
  });

  // Tenant Owners
  const sariOwner = await prisma.user.create({
    data: {
      name: 'Ibu Hj. Siti Sari',
      email: 'tenant.sari@foodqueue.id',
      passwordHash: tenantPass,
      role: 'TENANT',
      phone: '081288880001',
      status: 'ACTIVE',
    },
  });

  const kencanaOwner = await prisma.user.create({
    data: {
      name: 'Mas Dimas Kencana',
      email: 'tenant.kencana@foodqueue.id',
      passwordHash: tenantPass,
      role: 'TENANT',
      phone: '081288880002',
      status: 'ACTIVE',
    },
  });

  // Customers
  const rina = await prisma.user.create({
    data: {
      name: 'Rina Kartika (Mahasiswa Teknik)',
      email: 'rina@mahasiswa.ac.id',
      passwordHash: userPass,
      role: 'CUSTOMER',
      phone: '081377770001',
      status: 'ACTIVE',
    },
  });

  const budi = await prisma.user.create({
    data: {
      name: 'Budi Prakoso (Mahasiswa Ekonomi)',
      email: 'budi@mahasiswa.ac.id',
      passwordHash: userPass,
      role: 'CUSTOMER',
      phone: '081377770002',
      status: 'ACTIVE',
    },
  });

  const siti = await prisma.user.create({
    data: {
      name: 'Siti Rahma (Mahasiswa Kedokteran)',
      email: 'siti@mahasiswa.ac.id',
      passwordHash: userPass,
      role: 'CUSTOMER',
      phone: '081377770003',
      status: 'ACTIVE',
    },
  });

  const eko = await prisma.user.create({
    data: {
      name: 'Dr. Eko Prasetyo, M.T. (Dosen)',
      email: 'dosen.eko@kampus.ac.id',
      passwordHash: userPass,
      role: 'CUSTOMER',
      phone: '081377770004',
      status: 'ACTIVE',
    },
  });

  const fajar = await prisma.user.create({
    data: {
      name: 'Fajar Nugraha (Staf Administrasi)',
      email: 'fajar@mahasiswa.ac.id',
      passwordHash: userPass,
      role: 'CUSTOMER',
      phone: '081377770005',
      status: 'ACTIVE',
    },
  });

  // 5. Buat Kategori
  const catMakanan = await prisma.category.create({
    data: {
      name: 'Makanan Berat',
      slug: 'makanan-berat',
      description: 'Nasi, ayam, olahan daging dan menu santap siang kenyang.',
    },
  });

  const catMinuman = await prisma.category.create({
    data: {
      name: 'Minuman Segar',
      slug: 'minuman-segar',
      description: 'Aneka es teh, kopi susu aren, jus dan minuman dingin pelepas dahaga.',
    },
  });

  const catSnack = await prisma.category.create({
    data: {
      name: 'Camilan & Snack',
      slug: 'camilan-snack',
      description: 'Gorengan renyah, roti bakar, dan kudapan ringan.',
    },
  });

  const catMie = await prisma.category.create({
    data: {
      name: 'Mie & Bakso',
      slug: 'mie-bakso',
      description: 'Mie goreng Jawa, mie ayam lezat, dan bakso kuah hangat.',
    },
  });

  // 6. Buat Tenants
  const tenantSari = await prisma.tenant.create({
    data: {
      ownerId: sariOwner.id,
      venueId: venue.id,
      name: 'Warung Bu Sari',
      slug: 'warung-bu-sari',
      description: 'Aneka masakan nusantara rumahan favorit mahasiswa: nasi goreng, ayam geprek krispi, dan soto ayam segar.',
      location: 'Kantin Pusat Lt. 1, Stan No. 04',
      logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
      defaultPreparationTime: 10,
      slotDurationMinutes: 15,
      maxOrdersPerSlot: 10,
      isAcceptingOrders: true,
      status: 'ACTIVE',
      ratingAvg: 4.8,
      ratingCount: 142,
      verifiedAt: new Date(),
    },
  });

  const tenantKencana = await prisma.tenant.create({
    data: {
      ownerId: kencanaOwner.id,
      venueId: venue.id,
      name: 'Kopi & Snack Kencana',
      slug: 'kopi-snack-kencana',
      description: 'Pusat es kopi susu aren kekinian, aneka racikan teh, roti bakar lumer dan pisang goreng crispy.',
      location: 'Kantin Pusat Lt. 1, Stan No. 08',
      logoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80',
      defaultPreparationTime: 5,
      slotDurationMinutes: 15,
      maxOrdersPerSlot: 12,
      isAcceptingOrders: true,
      status: 'ACTIVE',
      ratingAvg: 4.9,
      ratingCount: 98,
      verifiedAt: new Date(),
    },
  });

  // 7. Jadwal Operasional Tenant (Senin - Sabtu 09:00 - 16:00, Minggu Tutup)
  const days = [0, 1, 2, 3, 4, 5, 6];
  for (const t of [tenantSari, tenantKencana]) {
    for (const day of days) {
      await prisma.tenantOperatingHour.create({
        data: {
          tenantId: t.id,
          dayOfWeek: day,
          openTime: '09:00',
          closeTime: day === 6 ? '15:00' : '16:00',
          isClosed: day === 0, // Minggu tutup
        },
      });
    }
  }

  // 8. Buat Menu Warung Bu Sari
  const menuNasiGoreng = await prisma.menu.create({
    data: {
      tenantId: tenantSari.id,
      categoryId: catMakanan.id,
      name: 'Nasi Goreng Spesial Kampus',
      description: 'Nasi goreng bumbu racikan rempah dengan suwiran ayam, telur mata sapi, acar segar, dan kerupuk renyah.',
      price: 18000,
      stock: 45,
      preparationTime: 10,
      imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
      status: 'AVAILABLE',
    },
  });

  const menuAyamGeprek = await prisma.menu.create({
    data: {
      tenantId: tenantSari.id,
      categoryId: catMakanan.id,
      name: 'Ayam Geprek Sambal Bawang + Nasi',
      description: 'Ayam goreng tepung renyah digeprek dengan sambal bawang pedas nampol level 1-5, lengkap dengan nasi hangat dan lalapan.',
      price: 20000,
      stock: 35,
      preparationTime: 12,
      imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
      status: 'AVAILABLE',
    },
  });

  const menuSotoAyam = await prisma.menu.create({
    data: {
      tenantId: tenantSari.id,
      categoryId: catMakanan.id,
      name: 'Soto Ayam Lamongan Gurih',
      description: 'Kuah kuning hangat beraroma rempah khas Lamongan dengan suwiran ayam melimpah, bihun, tauge, dan bubuk koya renyah.',
      price: 17000,
      stock: 25,
      preparationTime: 8,
      imageUrl: 'https://images.unsplash.com/photo-1572656631137-7935297eff55?auto=format&fit=crop&w=600&q=80',
      status: 'AVAILABLE',
    },
  });

  const menuMieGoreng = await prisma.menu.create({
    data: {
      tenantId: tenantSari.id,
      categoryId: catMie.id,
      name: 'Mie Goreng Jawa Telur',
      description: 'Mie telur dimasak nyemek manis gurih khas Jawa dengan potongan bakso, sawi hijau, dan taburan bawang goreng.',
      price: 16000,
      stock: 30,
      preparationTime: 10,
      imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
      status: 'AVAILABLE',
    },
  });

  const menuMendoan = await prisma.menu.create({
    data: {
      tenantId: tenantSari.id,
      categoryId: catSnack.id,
      name: 'Tempe Mendoan Gurih (Isi 4)',
      description: 'Tempe berbalut tepung bumbu daun bawang setengah matang lembut, disajikan dengan kecap cabe rawit pedas.',
      price: 10000,
      stock: 50,
      preparationTime: 5,
      imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
      status: 'AVAILABLE',
    },
  });

  // 9. Buat Menu Kopi & Snack Kencana
  const menuKopiAren = await prisma.menu.create({
    data: {
      tenantId: tenantKencana.id,
      categoryId: catMinuman.id,
      name: 'Es Kopi Susu Gula Aren Kencana',
      description: 'Espresso biji kopi nusantara dipadukan susu creamy segar dan manis legit gula aren murni.',
      price: 15000,
      stock: 80,
      preparationTime: 4,
      imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80',
      status: 'AVAILABLE',
    },
  });

  const menuEsTeh = await prisma.menu.create({
    data: {
      tenantId: tenantKencana.id,
      categoryId: catMinuman.id,
      name: 'Es Teh Manis Melati Kampus',
      description: 'Seduhan teh tubruk wangi melati yang disajikan dingin segar dalam gelas cup jumbo.',
      price: 5000,
      stock: 120,
      preparationTime: 2,
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
      status: 'AVAILABLE',
    },
  });

  const menuMatcha = await prisma.menu.create({
    data: {
      tenantId: tenantKencana.id,
      categoryId: catMinuman.id,
      name: 'Iced Matcha Latte Creamy',
      description: 'Bubuk green tea matcha premium diaduk lembut dengan susu segar gurih dingin.',
      price: 18000,
      stock: 40,
      preparationTime: 5,
      imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
      status: 'AVAILABLE',
    },
  });

  const menuRotiBakar = await prisma.menu.create({
    data: {
      tenantId: tenantKencana.id,
      categoryId: catSnack.id,
      name: 'Roti Bakar Coklat Keju Lumer',
      description: 'Roti tebal dipanggang mentega wangi diisi coklat meses melimpah dan taburan keju cheddar parut.',
      price: 14000,
      stock: 30,
      preparationTime: 7,
      imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80',
      status: 'AVAILABLE',
    },
  });

  const menuPisangGoreng = await prisma.menu.create({
    data: {
      tenantId: tenantKencana.id,
      categoryId: catSnack.id,
      name: 'Pisang Goreng Crispy Karamel',
      description: 'Pisang kepok manis berbalut tepung krispi renyah dengan siraman saus karamel dan gula palem.',
      price: 12000,
      stock: 35,
      preparationTime: 6,
      imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
      status: 'AVAILABLE',
    },
  });

  // 10. Generate Pickup Slots Hari Ini untuk Warung Bu Sari
  const now = new Date();
  const todayDateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const slot1130 = await prisma.pickupSlot.create({
    data: {
      tenantId: tenantSari.id,
      date: todayDate,
      startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 30),
      endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 45),
      capacity: 10,
      currentOrders: 6,
      status: 'OPEN',
    },
  });

  const slot1145 = await prisma.pickupSlot.create({
    data: {
      tenantId: tenantSari.id,
      date: todayDate,
      startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 45),
      endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0),
      capacity: 10,
      currentOrders: 8,
      status: 'OPEN',
    },
  });

  const slot1200 = await prisma.pickupSlot.create({
    data: {
      tenantId: tenantSari.id,
      date: todayDate,
      startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0),
      endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 15),
      capacity: 10,
      currentOrders: 10, // Slot Penuh!
      status: 'OPEN',
    },
  });

  const slot1215 = await prisma.pickupSlot.create({
    data: {
      tenantId: tenantSari.id,
      date: todayDate,
      startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 15),
      endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 30),
      capacity: 10,
      currentOrders: 3,
      status: 'OPEN',
    },
  });

  // 11. Buat Contoh Orders Nyata dengan Status Berbeda
  // Order 1: READY_FOR_PICKUP (dengan QR Code aktif untuk demo)
  const orderReady = await prisma.order.create({
    data: {
      orderNumber: 'FQ-2026-00123',
      userId: rina.id,
      tenantId: tenantSari.id,
      pickupSlotId: slot1215.id,
      subtotal: 38000,
      fee: 1000,
      total: 39000,
      status: 'READY_FOR_PICKUP',
      notes: 'Sambal ayam geprek dipisah ya bu.',
      pickupCode: 'FQ7K9A',
      idempotencyKey: 'seed-idemp-001',
      paidAt: new Date(now.getTime() - 25 * 60 * 1000),
      acceptedAt: new Date(now.getTime() - 20 * 60 * 1000),
      readyAt: new Date(now.getTime() - 5 * 60 * 1000),
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: orderReady.id,
        menuId: menuAyamGeprek.id,
        menuNameSnapshot: 'Ayam Geprek Sambal Bawang + Nasi',
        priceSnapshot: 20000,
        quantity: 1,
        subtotal: 20000,
        notes: 'Sambal dipisah',
      },
      {
        orderId: orderReady.id,
        menuId: menuNasiGoreng.id,
        menuNameSnapshot: 'Nasi Goreng Spesial Kampus',
        priceSnapshot: 18000,
        quantity: 1,
        subtotal: 18000,
      },
    ],
  });

  await prisma.payment.create({
    data: {
      orderId: orderReady.id,
      amount: 39000,
      method: 'QRIS',
      status: 'PAID',
      transactionReference: 'MOCK-PAY-QRIS-00123',
      paidAt: new Date(now.getTime() - 25 * 60 * 1000),
    },
  });

  // Order 2: COMPLETED dengan Review
  const orderCompleted = await prisma.order.create({
    data: {
      orderNumber: 'FQ-2026-00101',
      userId: budi.id,
      tenantId: tenantSari.id,
      pickupSlotId: slot1130.id,
      subtotal: 35000,
      fee: 1000,
      total: 36000,
      status: 'COMPLETED',
      pickupCode: 'BUD888',
      idempotencyKey: 'seed-idemp-002',
      paidAt: new Date(now.getTime() - 60 * 60 * 1000),
      acceptedAt: new Date(now.getTime() - 55 * 60 * 1000),
      readyAt: new Date(now.getTime() - 40 * 60 * 1000),
      completedAt: new Date(now.getTime() - 30 * 60 * 1000),
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: orderCompleted.id,
      menuId: menuSotoAyam.id,
      menuNameSnapshot: 'Soto Ayam Lamongan Gurih',
      priceSnapshot: 17000,
      quantity: 2,
      subtotal: 34000,
    },
  });

  await prisma.review.create({
    data: {
      orderId: orderCompleted.id,
      userId: budi.id,
      tenantId: tenantSari.id,
      rating: 5,
      comment: 'Sangat praktis! Datang langsung ambil tanpa perlu antre di depan stan. Kuah sotonya masih panas mantap!',
    },
  });

  // 12. Inisialisasi System Settings
  const settings = [
    { key: 'service_fee', value: '1000', description: 'Biaya layanan platform per pesanan (Rupiah)' },
    { key: 'payment_timeout_minutes', value: '15', description: 'Batas waktu pembayaran pesanan (menit)' },
    { key: 'booking_days_ahead', value: '2', description: 'Jumlah hari ke depan yang dapat dipesan' },
    { key: 'no_show_grace_minutes', value: '60', description: 'Batas toleransi kehadiran sebelum ditandai no-show' },
    { key: 'baseline_wait_minutes', value: '25', description: 'Rata-rata waktu tunggu manual sebelum sistem (menit)' },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      create: s,
      update: s,
    });
  }

  // 13. Inisialisasi Order Counter
  await prisma.orderCounter.upsert({
    where: { year: now.getFullYear() },
    create: { year: now.getFullYear(), lastValue: 125 },
    update: { lastValue: 125 },
  });

  console.log('[SUCCESS] Seeding berhasil diselesaikan!');
  console.log('----------------------------------------------------');
  console.log('Akun Demo:');
  console.log('1. Admin: admin@foodqueue.id | Password: Admin123!');
  console.log('2. Tenant Sari: tenant.sari@foodqueue.id | Password: Tenant123!');
  console.log('3. Tenant Kencana: tenant.kencana@foodqueue.id | Password: Tenant123!');
  console.log('4. Customer Rina: rina@mahasiswa.ac.id | Password: User123!');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('[ERROR] Gagal melakukan seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
