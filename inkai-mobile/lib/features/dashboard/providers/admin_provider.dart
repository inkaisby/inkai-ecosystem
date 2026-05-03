import 'package:flutter/material.dart';
import '../../../core/network/api_service.dart';

class AdminProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  Map<String, dynamic> _stats = {
    'totalMembers': 0,
    'totalDojos': 0,
    'totalProvinces': 0,
    'iuranTotal': 0,
    'pendingVerifications': 0,
  };
  bool _isLoading = false;

  Map<String, dynamic> get stats => _stats;
  bool get isLoading => _isLoading;

  Future<void> fetchStats() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.getDashboardStats();
      if (response.data['status'] == 'success') {
        _stats = response.data['data'];
      }
    } catch (e) {
      debugPrint('Fetch Stats Error: $e');
    }

    _isLoading = false;
    notifyListeners();
  }
}
