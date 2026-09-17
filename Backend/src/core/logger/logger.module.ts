import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { AppConfigService } from '../config/config.service';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const isProd = config.isProduction;

        return {
          pinoHttp: {
            level: isProd ? 'info' : 'debug',
            autoLogging: true,
            // Clean one-line log output without large req/res dumps
            serializers: {
              req: () => undefined,
              res: () => undefined,
              err: () => undefined,
            },
            customSuccessMessage: (req: any, res: any, responseTime: number) => {
              return `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`;
            },
            customErrorMessage: (req: any, res: any, error: Error) => {
              return `${req.method} ${req.url} ${res.statusCode} - ${error.message}`;
            },
            customLogLevel: (req: any, res: any, err: any) => {
              if (res.statusCode >= 500 || err) return 'error';
              if (res.statusCode >= 400) return 'warn';
              return 'info';
            },
            transport: isProd
              ? undefined
              : {
                  target: require.resolve('pino-pretty'),
                  options: {
                    singleLine: true,
                    colorize: true,
                    translateTime: 'SYS:HH:MM:ss',
                    ignore: 'pid,hostname,req,res,responseTime',
                  },
                },
          },
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
