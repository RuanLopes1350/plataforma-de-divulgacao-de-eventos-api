import * as Minio from 'minio';
import dotenv from "dotenv";
dotenv.config();

const local = process.env.MINIO_LOCAL === 'true';

const requiredMinioVars = [
    'MINIO_ENDPOINT',
    'MINIO_PORT',
    'MINIO_ACCESS_KEY',
    'MINIO_SECRET_KEY',
    'MINIO_BUCKET_FOTOS',
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

if (local === 'true') {
    console.warn('Atenção: O MinIO está configurado para rodar localmente. Certifique-se de que o serviço do MinIO esteja ativo e acessível em localhost:9000.');

    //Definir politicas do bucket para acesso público
    async function inicializarBuckets() {
        const bucketName = process.env.MINIO_BUCKET_FOTOS;
        const bucketPolicy = {
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Principal: "*",
                    Action: ["s3:GetObject"],
                    Resource: [`arn:aws:s3:::${bucketName}/*`]
                }
            ]
        }
        if (!await minioClient.bucketExists(bucketName)) {
            await minioClient.makeBucket(bucketName, 'us-east-1');
            await minioClient.setBucketPolicy(bucketName, JSON.stringify(bucketPolicy));
        }
    }
    // Inicializar buckets e políticas ao iniciar a aplicação
    inicializarBuckets()
        .then(() => console.log('Buckets do MinIO inicializados com sucesso.'))
        .catch((error) => {
            console.error('Erro ao inicializar buckets do MinIO:', error);
            process.exit(1);
        });
} else {
    console.warn('Atenção: O MinIO está configurado para rodar em um ambiente de produção. Certifique-se de que as variáveis de ambiente estejam corretamente configuradas e que o serviço do MinIO esteja acessível no endpoint especificado.');
}

export default minioClient;