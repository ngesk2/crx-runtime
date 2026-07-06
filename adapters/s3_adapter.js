/**
 * S3 Adapter
 * 
 * Infrastructure adapter for S3-compatible object storage
 * 
 * Responsibilities:
 * - put(bucket, key, data)
 * - get(bucket, key)
 * - delete(bucket, key)
 * - list(bucket, prefix)
 * 
 * This adapter is infrastructure-only. No constitutional logic.
 */

class S3Adapter {
  constructor(endpoint, accessKey, secretKey, region = 'us-east-1') {
    this._endpoint = endpoint;
    this._accessKey = accessKey;
    this._secretKey = secretKey;
    this._region = region;
    this._client = null;
  }

  /**
   * Initialize S3 client
   */
  async initialize() {
    const { S3Client } = require('@aws-sdk/client-s3');
    
    this._client = new S3Client({
      endpoint: this._endpoint,
      credentials: {
        accessKeyId: this._accessKey,
        secretAccessKey: this._secretKey,
      },
      region: this._region,
      forcePathStyle: true, // For MinIO and other S3-compatible services
    });

    console.log('[S3Adapter] Initialized S3 client');
  }

  /**
   * Put object
   * 
   * @param {string} bucket - Bucket name
   * @param {string} key - Object key
   * @param {Buffer|string} data - Object data
   * @param {string} contentType - Content type
   * @returns {Object} Put result
   */
  async put(bucket, key, data, contentType = 'application/octet-stream') {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');

    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      });

      await this._client.send(command);
      
      return {
        success: true,
        bucket: bucket,
        key: key,
      };
    } catch (error) {
      throw new Error(`S3 put failed: ${error.message}`);
    }
  }

  /**
   * Get object
   * 
   * @param {string} bucket - Bucket name
   * @param {string} key - Object key
   * @returns {Object} Get result with data
   */
  async get(bucket, key) {
    const { GetObjectCommand } = require('@aws-sdk/client-s3');

    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await this._client.send(command);
      const chunks = [];
      
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }

      const data = Buffer.concat(chunks);
      
      return {
        success: true,
        bucket: bucket,
        key: key,
        data: data,
        contentType: response.ContentType,
        metadata: response.Metadata,
      };
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return {
          success: false,
          bucket: bucket,
          key: key,
          error: 'Object not found',
        };
      }
      throw new Error(`S3 get failed: ${error.message}`);
    }
  }

  /**
   * Delete object
   * 
   * @param {string} bucket - Bucket name
   * @param {string} key - Object key
   * @returns {boolean} Delete success
   */
  async delete(bucket, key) {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await this._client.send(command);
      
      return true;
    } catch (error) {
      throw new Error(`S3 delete failed: ${error.message}`);
    }
  }

  /**
   * List objects
   * 
   * @param {string} bucket - Bucket name
   * @param {string} prefix - Key prefix
   * @returns {Array} List of objects
   */
  async list(bucket, prefix = '') {
    const { ListObjectsV2Command } = require('@aws-sdk/client-s3');

    try {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
      });

      const response = await this._client.send(command);
      
      return {
        success: true,
        bucket: bucket,
        prefix: prefix,
        objects: response.Contents || [],
      };
    } catch (error) {
      throw new Error(`S3 list failed: ${error.message}`);
    }
  }

  /**
   * Check if object exists
   * 
   * @param {string} bucket - Bucket name
   * @param {string} key - Object key
   * @returns {boolean} Object exists
   */
  async exists(bucket, key) {
    const { HeadObjectCommand } = require('@aws-sdk/client-s3');

    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await this._client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.name === 'NoSuchKey') {
        return false;
      }
      throw new Error(`S3 exists failed: ${error.message}`);
    }
  }

  /**
   * Create bucket
   * 
   * @param {string} bucket - Bucket name
   * @returns {boolean} Create success
   */
  async createBucket(bucket) {
    const { CreateBucketCommand } = require('@aws-sdk/client-s3');

    try {
      const command = new CreateBucketCommand({
        Bucket: bucket,
      });

      await this._client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'BucketAlreadyExists' || error.name === 'BucketAlreadyOwnedByYou') {
        return true;
      }
      throw new Error(`S3 create bucket failed: ${error.message}`);
    }
  }

  /**
   * Check health
   * 
   * @returns {Object} Health status
   */
  async health() {
    try {
      const { ListBucketsCommand } = require('@aws-sdk/client-s3');
      const command = new ListBucketsCommand({});
      
      await this._client.send(command);
      
      return {
        healthy: true,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }
}

module.exports = { S3Adapter };
