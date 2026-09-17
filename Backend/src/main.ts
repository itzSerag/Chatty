import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import cookieParser from "cookie-parser";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { AllExceptionsFilter } from "./core/errors/errors.global.filter";
import * as bodyParser from 'body-parser';
import { Logger } from "nestjs-pino";
import { AppConfigService } from "./core/config/config.service";


async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });

    // Use Pino logger for all NestJS internal and HTTP logs
    const logger = app.get(Logger);
    app.useLogger(logger);

    const configService = app.get(AppConfigService);

    // Production origins + optional custom frontend URL from .env
    const allowedOrigins = [
        'https://realtime-mern-chatty-frontend.vercel.app',
        ...(configService.frontendUrl ? [configService.frontendUrl] : []),
    ];

    // Dynamic CORS: automatically allows any localhost or 127.0.0.1 port (5173, 5174, etc.)
    app.enableCors({
        origin: (origin, callback) => {
            // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
            if (!origin) return callback(null, true);

            const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
            if (isLocal || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error(`Blocked by CORS: Origin ${origin} is not allowed.`), false);
        },
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    });

    app.enableVersioning({
        type: VersioningType.URI,
    });

    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
    app.use(cookieParser());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: false,
            transform: true,
        }),
    );

    app.setGlobalPrefix("api");
    app.useGlobalFilters(new AllExceptionsFilter());

    const port = configService.port;
    await app.listen(port);
    logger.log(`🚀 Application is running on port ${port} in ${configService.nodeEnv} mode`);
}

bootstrap();