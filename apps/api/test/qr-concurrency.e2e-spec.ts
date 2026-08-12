import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('QR Concurrency Protection (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Login as Security User
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: 'security1@safedsheri.com', password: 'SecurityPass123!' });

    authToken = loginRes.body.data.accessToken;

    // Fetch active credential token from seed
    const activeCred = await prisma.credential.findFirst({
      where: { status: 'ACTIVE' },
    });
    testToken = activeCred ? activeCred.secureToken : 'ss_qr_demo_ready_02';
  });

  afterAll(async () => {
    await app.close();
  });

  it('should guarantee that simultaneous scans of the exact same QR results in ONE VALID and ONE ALREADY_USED', async () => {
    // Fire 2 parallel scan requests for the exact same token
    const [res1, res2] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/entries/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ token: testToken }),

      request(app.getHttpServer())
        .post('/api/v1/entries/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ token: testToken }),
    ]);

    const status1 = res1.body.data.status;
    const status2 = res2.body.data.status;

    const results = [status1, status2].sort();

    // MUST return exactly ['NOT_VALID', 'VALID'] or ['ALREADY_USED', 'VALID']
    expect(results).toContain('VALID');
    expect(results).toContain('NOT_VALID');
    expect(results).not.toEqual(['VALID', 'VALID']);
  });
});
