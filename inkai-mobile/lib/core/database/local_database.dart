import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class LocalDatabase {
  static final LocalDatabase instance = LocalDatabase._init();
  static Database? _database;

  LocalDatabase._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('inkai_local.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        data TEXT NOT NULL,
        operation TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    ''');

    await db.execute('''
      CREATE TABLE attendance (
        id TEXT PRIMARY KEY,
        memberId TEXT NOT NULL,
        dojoId TEXT NOT NULL,
        checkInAt TEXT NOT NULL,
        method TEXT DEFAULT 'QR_SCAN',
        isDeleted INTEGER DEFAULT 0,
        isSynced INTEGER DEFAULT 1
      )
    ''');
    
    // Add other tables as needed (members, dojos, etc.)
  }

  Future<void> addToSyncQueue(String tableName, String data, String operation) async {
    final db = await instance.database;
    await db.insert('sync_queue', {
      'table_name': tableName,
      'data': data,
      'operation': operation,
    });
  }
}
