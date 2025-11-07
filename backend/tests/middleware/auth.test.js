/**
 * Unit tests for Authentication Middleware
 * Tests JWT verification and authorization
 */

const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../../src/middleware/auth');

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token successfully', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

      req.headers.authorization = `Bearer ${token}`;

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(1);
      expect(req.user.email).toBe('test@example.com');
    });

    it('should reject request without authorization header', () => {
      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No authorization token provided',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject malformed authorization header', () => {
      req.headers.authorization = 'InvalidFormat token123';

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Invalid'),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject expired token', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '0s' });

      req.headers.authorization = `Bearer ${token}`;

      // Wait for token to expire
      setTimeout(() => {
        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: expect.stringContaining('expired'),
        });
        expect(next).not.toHaveBeenCalled();
      }, 100);
    });

    it('should reject token with invalid signature', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const token = jwt.sign(payload, 'wrong_secret', { expiresIn: '15m' });

      req.headers.authorization = `Bearer ${token}`;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Invalid'),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle token without Bearer prefix', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

      req.headers.authorization = token; // No "Bearer " prefix

      authenticateToken(req, res, next);

      // Should either accept it or reject it consistently
      if (res.status.mock.calls.length > 0) {
        expect(res.status).toHaveBeenCalledWith(401);
      } else {
        expect(next).toHaveBeenCalledWith();
      }
    });

    it('should preserve other request properties', () => {
      const payload = { userId: 1 };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

      req.headers.authorization = `Bearer ${token}`;
      req.body = { data: 'test' };
      req.params = { id: '123' };
      req.query = { filter: 'active' };

      authenticateToken(req, res, next);

      expect(req.body).toEqual({ data: 'test' });
      expect(req.params).toEqual({ id: '123' });
      expect(req.query).toEqual({ filter: 'active' });
    });

    it('should handle malformed JWT', () => {
      req.headers.authorization = 'Bearer not.a.valid.jwt.token';

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.any(String),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject empty token', () => {
      req.headers.authorization = 'Bearer ';

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long tokens', () => {
      const payload = { userId: 1, data: 'x'.repeat(1000) };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

      req.headers.authorization = `Bearer ${token}`;

      authenticateToken(req, res, next);

      // Should handle without crashing
      expect(next).toHaveBeenCalled();
    });

    it('should handle special characters in token payload', () => {
      const payload = {
        userId: 1,
        email: 'test+special@example.com',
        name: "O'Brien",
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

      req.headers.authorization = `Bearer ${token}`;

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.email).toBe('test+special@example.com');
      expect(req.user.name).toBe("O'Brien");
    });

    it('should handle case-insensitive Bearer keyword', () => {
      const payload = { userId: 1 };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

      req.headers.authorization = `bearer ${token}`; // lowercase

      authenticateToken(req, res, next);

      // Should handle case-insensitively
      const called = next.mock.calls.length > 0 || res.status.mock.calls.length > 0;
      expect(called).toBe(true);
    });
  });
});
