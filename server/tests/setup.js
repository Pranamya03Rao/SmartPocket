process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-chars-long-strictly-enforced!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long-strictly-enforced!';
process.env.ENCRYPTION_KEY = 'MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=';
process.env.MONGODB_URI = 'mongodb://localhost:27017/smart_budget_test';
process.env.CLIENT_URL = 'http://localhost:5173';
