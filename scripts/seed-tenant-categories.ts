import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Menyiapkan kategori tenant tanpa emoticon...');

  const categories = [
    {
      name: 'Aneka Nasi & Lauk',
      slug: 'aneka-nasi',
      description: 'Warung nasi, lauk pauk nusantara, dan olahan ayam.',
    },
    {
      name: 'Minuman & Kopi',
      slug: 'minuman-kopi',
      description: 'Kopi, teh, jus buah, dan aneka minuman segar.',
    },
    {
      name: 'Mie, Bakso & Soto',
      slug: 'mie-bakso-soto',
      description: 'Aneka olahan mie, bakso sapi, dan soto kuah hangat.',
    },
    {
      name: 'Camilan & Snack',
      slug: 'camilan-snack',
      description: 'Gorengan renyah, roti bakar, dan kudapan ringan.',
    },
    {
      name: 'Cepat Saji',
      slug: 'cepat-saji',
      description: 'Burger, kentang goreng, dan hidangan siap saji.',
    },
    {
      name: 'Makanan Sehat',
      slug: 'makanan-sehat',
      description: 'Gado-gado, salad, dan aneka olahan sayur segar.',
    },
  ];

  const categoryMap = new Map<string, string>();

  for (const cat of categories) {
    const upserted = await prisma.tenantCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
      },
      create: cat,
    });
    categoryMap.set(cat.slug, upserted.id);
    console.log(`Kategori siap: ${upserted.name} (${upserted.id})`);
  }

  // Update existing tenants
  const tenants = await prisma.tenant.findMany();
  console.log(`Ditemukan ${tenants.length} tenant.`);

  for (const tenant of tenants) {
    let catSlug = 'aneka-nasi';
    const lowerName = tenant.name.toLowerCase();

    if (lowerName.includes('kopi') || lowerName.includes('minuman') || lowerName.includes('tea') || lowerName.includes('kencana')) {
      catSlug = 'minuman-kopi';
    } else if (lowerName.includes('mie') || lowerName.includes('bakso') || lowerName.includes('soto')) {
      catSlug = 'mie-bakso-soto';
    } else if (lowerName.includes('snack') || lowerName.includes('roti') || lowerName.includes('pisang')) {
      catSlug = 'camilan-snack';
    } else if (lowerName.includes('burger') || lowerName.includes('fast')) {
      catSlug = 'cepat-saji';
    } else if (lowerName.includes('sehat') || lowerName.includes('salad')) {
      catSlug = 'makanan-sehat';
    }

    const targetCatId = categoryMap.get(catSlug);
    if (targetCatId) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { tenantCategoryId: targetCatId },
      });
      console.log(`Tenant '${tenant.name}' dikaitkan ke kategori '${catSlug}'.`);
    }
  }

  console.log('Selesai inisialisasi kategori tenant!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
