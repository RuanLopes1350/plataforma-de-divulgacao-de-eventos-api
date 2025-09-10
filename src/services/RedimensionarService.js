import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export default async function redimensionarImagem(caminhoArquivo, largura, altura) {
    try {
        const caminhoTemp = `${caminhoArquivo}.temp`;
        
        // Redimensiona e salva em arquivo temporário
        await sharp(caminhoArquivo)
            .resize(largura, altura, {
                fit: sharp.fit.inside,
                withoutEnlargement: true
            })
            .toFile(caminhoTemp);
        
        // Substitui o arquivo original pelo redimensionado
        fs.renameSync(caminhoTemp, caminhoArquivo);
        
        return caminhoArquivo;
    } catch (error) {
        // Remove o arquivo temporário em caso de erro
        const caminhoTemp = `${caminhoArquivo}.temp`;
        if (fs.existsSync(caminhoTemp)) {
            fs.unlinkSync(caminhoTemp);
        }
        throw new Error(`Erro ao redimensionar imagem: ${error.message}`);
    }
}