import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

class DatabaseService {
  static const String _databaseName = 'strength_design.db';
  static const int _databaseVersion = 1;

  static Future<Database> initDatabase() async {
    final String path = join(await getDatabasesPath(), _databaseName);
    return openDatabase(path, version: _databaseVersion, onCreate: _onCreate);
  }

  static Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE exercises (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        muscleGroups TEXT,
        equipment TEXT,
        videoUrl TEXT
      )
    ''');
  }
}
