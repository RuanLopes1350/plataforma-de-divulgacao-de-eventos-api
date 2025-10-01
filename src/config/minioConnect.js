import * as Minio from 'minio';
import 'dotenv/config';

const requiredMinioVars = [
    'MINIO_ENDPOINT',
    'MINIO_PORT',
    'MINIO_ACCESS_KEY',
    'MINIO_SECRET_KEY',
];

for (const varName of requiredMinioVars) {
    if (!process.env[varName]) {
        throw new Error(`Variável de ambiente para o MinIO ausente: ${varName}`);
    }
}

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT, 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
});

export default minioClient;
