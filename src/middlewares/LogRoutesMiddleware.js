// middlewares/LogRoutesMiddlewares.js

const logRoutes = async (req, res, next) => {
    try {
        // Ignorar logs de favicon e assets estáticos do Swagger
        if (req.originalUrl.includes('favicon') || 
            req.originalUrl.includes('.css') || 
            req.originalUrl.includes('.js') || 
            req.originalUrl.includes('.png') || 
            req.originalUrl.includes('.ico')) {
            return next();
        }

        const timestamp = new Date().toISOString();

        let ip = req.headers["x-forwarded-for"] ||
            req.socket.remoteAddress ||
            null;

        console.log(timestamp + " " + ip + " " + req.method + " " + req.protocol + "://" + req.get("host") + req.originalUrl);
    } catch (e) {
        console.log("Erro ao fazer o log", e);
    }
    next();
};

export default logRoutes;