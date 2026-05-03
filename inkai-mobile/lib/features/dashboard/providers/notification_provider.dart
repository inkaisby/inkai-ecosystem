import 'package:flutter/material.dart';
import '../../../core/network/api_service.dart';

class NotificationProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  List<dynamic> _notifications = [];
  bool _isLoading = false;

  List<dynamic> get notifications => _notifications;
  bool get isLoading => _isLoading;
  int get unreadCount => _notifications.where((n) => n['isRead'] == false).length;

  Future<void> fetchNotifications() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.getNotifications();
      if (response.data['status'] == 'success') {
        _notifications = response.data['data'];
      }
    } catch (e) {
      debugPrint('Fetch Notifications Error: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> markAsRead(String id) async {
    try {
      await _apiService.dio.patch('/notifications/$id/read');
      final index = _notifications.indexWhere((n) => n['id'] == id);
      if (index != -1) {
        _notifications[index]['isRead'] = true;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Mark As Read Error: $e');
    }
  }
}
