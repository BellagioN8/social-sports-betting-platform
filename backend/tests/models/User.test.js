/**
 * Unit tests for User Model
 * Tests user creation, validation, and authentication
 */

const { Pool } = require('pg');
const User = require('../../src/models/User');

// Mock pg Pool
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('User Model', () => {
  let pool;

  beforeEach(() => {
    pool = new Pool();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const mockResult = {
        rows: [{
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          created_at: new Date()
        }]
      };

      pool.query.mockResolvedValue(mockResult);

      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword123'
      };

      const user = await User.create(userData);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['testuser', 'test@example.com', 'hashedpassword123'])
      );

      expect(user).toHaveProperty('id', 1);
      expect(user).toHaveProperty('username', 'testuser');
      expect(user).toHaveProperty('email', 'test@example.com');
      expect(user).not.toHaveProperty('password');
    });

    it('should throw error for duplicate username', async () => {
      pool.query.mockRejectedValue({
        code: '23505', // PostgreSQL unique violation
        constraint: 'users_username_key'
      });

      const userData = {
        username: 'existinguser',
        email: 'test@example.com',
        password: 'hashedpassword123'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should throw error for duplicate email', async () => {
      pool.query.mockRejectedValue({
        code: '23505',
        constraint: 'users_email_key'
      });

      const userData = {
        username: 'testuser',
        email: 'existing@example.com',
        password: 'hashedpassword123'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should handle missing required fields', async () => {
      pool.query.mockRejectedValue({
        code: '23502', // PostgreSQL not-null violation
      });

      const userData = {
        username: 'testuser',
        // missing email and password
      };

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockResult = {
        rows: [{
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password_hash: 'hashedpassword',
          created_at: new Date()
        }]
      };

      pool.query.mockResolvedValue(mockResult);

      const user = await User.findByEmail('test@example.com');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['test@example.com']
      );

      expect(user).toHaveProperty('id', 1);
      expect(user).toHaveProperty('email', 'test@example.com');
    });

    it('should return null for non-existent email', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const user = await User.findByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });

    it('should handle database errors', async () => {
      pool.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(User.findByEmail('test@example.com')).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const mockResult = {
        rows: [{
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          created_at: new Date()
        }]
      };

      pool.query.mockResolvedValue(mockResult);

      const user = await User.findById(1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );

      expect(user).toHaveProperty('id', 1);
      expect(user).not.toHaveProperty('password_hash');
    });

    it('should return null for non-existent ID', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const user = await User.findById(999);

      expect(user).toBeNull();
    });

    it('should handle invalid ID types', async () => {
      pool.query.mockRejectedValue(new Error('Invalid input syntax for integer'));

      await expect(User.findById('invalid')).rejects.toThrow();
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const mockResult = {
        rows: [{
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          created_at: new Date()
        }]
      };

      pool.query.mockResolvedValue(mockResult);

      const user = await User.findByUsername('testuser');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['testuser']
      );

      expect(user).toHaveProperty('username', 'testuser');
    });

    it('should return null for non-existent username', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const user = await User.findByUsername('nonexistent');

      expect(user).toBeNull();
    });

    it('should be case-sensitive', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const user = await User.findByUsername('TestUser');

      // Should search for exact case
      expect(pool.query).toHaveBeenCalledWith(
        expect.anything(),
        ['TestUser']
      );
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const mockResult = {
        rows: [{
          id: 1,
          username: 'updateduser',
          email: 'updated@example.com',
          created_at: new Date()
        }]
      };

      pool.query.mockResolvedValue(mockResult);

      const updates = {
        username: 'updateduser',
        email: 'updated@example.com'
      };

      const user = await User.update(1, updates);

      expect(pool.query).toHaveBeenCalled();
      expect(user).toHaveProperty('username', 'updateduser');
      expect(user).toHaveProperty('email', 'updated@example.com');
    });

    it('should not update password directly', async () => {
      pool.query.mockResolvedValue({
        rows: [{ id: 1, username: 'testuser', email: 'test@example.com' }]
      });

      const updates = {
        password: 'newsecretpassword' // Should be ignored or handled specially
      };

      await User.update(1, updates);

      // Verify password wasn't included in update
      const call = pool.query.mock.calls[0];
      if (call[0].includes('password')) {
        expect(call[1]).not.toContain('newsecretpassword');
      }
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      const result = await User.delete(1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM users'),
        [1]
      );

      expect(result).toBe(true);
    });

    it('should return false for non-existent user', async () => {
      pool.query.mockResolvedValue({ rowCount: 0 });

      const result = await User.delete(999);

      expect(result).toBe(false);
    });

    it('should handle database errors during deletion', async () => {
      pool.query.mockRejectedValue(new Error('Foreign key constraint violation'));

      await expect(User.delete(1)).rejects.toThrow();
    });
  });
});
