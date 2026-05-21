import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  await prisma.users.upsert({
    where: { email: 'admin.test@gmail.com' },
    update: {
      role: 'ADMIN',
      password_hash: passwordHash,
    },
    create: {
      name: 'Admin Test',
      email: 'admin.test@gmail.com',
      password_hash: passwordHash,
      role: 'ADMIN',
    },
  });

  const features = [
    {
      code: 'AI_CHAT',
      name: 'AI Chat',
      description: 'Cho phép sử dụng chatbot AI',
    },
    {
      code: 'IMAGE_GENERATION',
      name: 'Tạo hình AI',
      description: 'Cho phép tạo hình ảnh bằng AI',
    },
    {
      code: 'AUTO_POST',
      name: 'Auto Post',
      description: 'Tự động đăng bài lên nền tảng đã kết nối',
    },
    {
      code: 'ANALYTICS',
      name: 'Analytics',
      description: 'Xem báo cáo và phân tích dữ liệu',
    },
    {
      code: 'PRIORITY_SUPPORT',
      name: 'Priority Support',
      description: 'Hỗ trợ ưu tiên',
    },
  ];

  for (const feature of features) {
    await prisma.features.upsert({
      where: { code: feature.code },
      update: {
        name: feature.name,
        description: feature.description,
      },
      create: feature,
    });
  }

  const packageSeeds = [
    {
      name: 'Basic',
      description: 'Gói cơ bản cho người mới bắt đầu',
      price: 99000,
      credits: 100,
      featureCodes: ['AI_CHAT'],
    },
    {
      name: 'Pro',
      description: 'Gói nâng cao cho người dùng thường xuyên',
      price: 199000,
      credits: 300,
      featureCodes: ['AI_CHAT', 'IMAGE_GENERATION', 'AUTO_POST'],
    },
    {
      name: 'Business',
      description: 'Gói doanh nghiệp mở khóa toàn bộ tính năng',
      price: 499000,
      credits: 1000,
      featureCodes: [
        'AI_CHAT',
        'IMAGE_GENERATION',
        'AUTO_POST',
        'ANALYTICS',
        'PRIORITY_SUPPORT',
      ],
    },
  ];

  for (const item of packageSeeds) {
    const existingPackage = await prisma.packages.findFirst({
      where: { name: item.name },
    });

    const createdPackage = existingPackage
      ? await prisma.packages.update({
          where: { id: existingPackage.id },
          data: {
            description: item.description,
            price: item.price,
            credits: item.credits,
            is_active: true,
          },
        })
      : await prisma.packages.create({
          data: {
            name: item.name,
            description: item.description,
            price: item.price,
            credits: item.credits,
            is_active: true,
          },
        });

    await prisma.package_features.deleteMany({
      where: { package_id: createdPackage.id },
    });

    const packageFeatures = await prisma.features.findMany({
      where: {
        code: {
          in: item.featureCodes,
        },
      },
    });

    await prisma.package_features.createMany({
      data: packageFeatures.map((feature) => ({
        package_id: createdPackage.id,
        feature_id: feature.id,
      })),
      skipDuplicates: true,
    });
  }

  console.log('Seed completed: admin, features, and packages');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
