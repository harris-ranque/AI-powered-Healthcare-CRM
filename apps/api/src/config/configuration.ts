export interface AppConfig {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
}

export default (): AppConfig => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  return {
    port: parseInt(process.env.PORT || '3001', 10),
    databaseUrl,
    jwtSecret: process.env.JWT_SECRET ?? '',
  };
};
