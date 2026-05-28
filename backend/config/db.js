import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/foodforme');
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Programmatically drop the old unique number index if it exists in tables collection to support multi-tenancy
    try {
      const db = conn.connection.db;
      const collections = await db.listCollections({ name: 'tables' }).toArray();
      if (collections.length > 0) {
        const tableCollection = db.collection('tables');
        const indexes = await tableCollection.indexes();
        const hasNumberUniqueIndex = indexes.some(idx => idx.name === 'number_1');
        if (hasNumberUniqueIndex) {
          await tableCollection.dropIndex('number_1');
          console.log('Successfully dropped old unique index "number_1" from tables collection.');
        }
      }
    } catch (indexErr) {
      console.warn('Non-fatal error checking/dropping unique index "number_1" in tables collection:', indexErr.message);
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
  }
};

export default connectDB;
