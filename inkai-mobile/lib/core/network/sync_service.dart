import 'dart:convert';
import 'package:dio/dio.dart';
import '../database/local_database.dart';
import './api_service.dart';

class SyncService {
  final ApiService _apiService = ApiService();

  Future<void> syncData() async {
    final db = await LocalDatabase.instance.database;
    
    // 1. Get pending items from sync queue
    final List<Map<String, dynamic>> queue = await db.query('sync_queue');
    if (queue.isEmpty) return;

    print('🔄 Starting background sync of ${queue.length} items...');

    // 2. Batch process (simplified for this demo)
    List<Map<String, dynamic>> attendancesToPush = [];
    
    for (var item in queue) {
      if (item['table_name'] == 'attendance') {
        attendancesToPush.add(jsonDecode(item['data']));
      }
    }

    try {
      if (attendancesToPush.isNotEmpty) {
        final response = await _apiService.dio.post('/sync/push', data: {
          'attendances': attendancesToPush,
        });

        if (response.statusCode == 200) {
          // Clear queue if successful
          await db.delete('sync_queue');
          print('✅ Sync completed successfully');
        }
      }
    } catch (e) {
      print('❌ Sync failed: $e');
    }
  }
}
